import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from './admin-service.js';
import { choice, identifier, loginEmail, number, password, PortalError, text, checkOrderTransition } from './portal-policy.js';

type Body = Record<string, unknown>;
type Actor = { uid: string; role: 'farmer' | 'vendor' | 'office'; admin: boolean; name: string };
const stamp = () => new Date().toISOString();

export async function createPortalAccount(role: 'office' | 'vendor', input: Body, createdBy: string, admin = false) {
  const id = identifier(role, input.identifier);
  const fullName = text(input.fullName, 'Full name');
  const secret = password(input.password);
  const profile = role === 'vendor' ? {
    businessName: text(input.businessName, 'Business name'),
    phone: text(input.phone, 'Phone', 30), location: text(input.location, 'Service location'), email: id,
  } : { officialId: id, district: text(input.district, 'District'), admin };
  const user = await adminAuth().createUser({ email: loginEmail(role, id), password: secret, displayName: fullName });
  try {
    await adminAuth().setCustomUserClaims(user.uid, { portal: role });
    await adminDb().collection(role === 'office' ? 'officeMembers' : 'vendorProfiles').doc(user.uid).create({
      ...profile, fullName, uid: user.uid, active: true, createdBy, createdAt: stamp(), updatedAt: stamp(),
    });
    await adminDb().collection('users').doc(user.uid).set({
      id: user.uid,
      email: role === 'vendor' ? id : loginEmail(role, id),
      fullName,
      accountType: role === 'office' ? 'official' : 'vendor',
      portalRole: role,
      portalRoles: [role],
      officialId: role === 'office' ? id : '',
      vendorId: role === 'vendor' ? user.uid : '',
      isAdmin: role === 'office' && admin,
      createdAt: stamp(),
      updatedAt: stamp(),
    }, { merge: true });
  } catch (error) {
    await adminAuth().deleteUser(user.uid);
    throw error;
  }
  return { uid: user.uid, identifier: id };
}

async function verifyPassword(role: 'office' | 'vendor', id: string, secret: string) {
  const key = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyA3ATSXymkbAz4Vi71LJeKrhw_kYSBzJJk';
  const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const base = emulator ? `http://${emulator}/identitytoolkit.googleapis.com` : 'https://identitytoolkit.googleapis.com';
  const response = await fetch(`${base}/v1/accounts:signInWithPassword?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: loginEmail(role, id), password: secret, returnSecureToken: true }),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok) throw new PortalError(response.status === 429 ? 429 : 401, 'Unable to sign in. Check this portal’s credentials or contact your administrator.');
  return result.localId as string;
}

export async function actorForToken(token: string): Promise<Actor> {
  let decoded;
  try { decoded = await adminAuth().verifyIdToken(token, true); }
  catch { throw new PortalError(401, 'Your session has expired. Sign in again.'); }
  const role = decoded.portal;
  if (role === 'office' || role === 'vendor') {
    const member = await adminDb().collection(role === 'office' ? 'officeMembers' : 'vendorProfiles').doc(decoded.uid).get();
    if (!member.exists || member.data()?.active !== true) throw new PortalError(403, 'This portal account is inactive. Contact the administrator.');
    return { uid: decoded.uid, role, admin: role === 'office' && member.data()?.admin === true, name: member.data()?.fullName || '' };
  }
  if (role) throw new PortalError(403, 'Unknown portal identity.');
  const farmer = await adminDb().collection('users').doc(decoded.uid).get();
  if (!farmer.exists) throw new PortalError(403, 'Complete farmer registration first.');
  return { uid: decoded.uid, role: 'farmer', admin: false, name: farmer.data()?.fullName || 'Farmer' };
}

function requireRole(actor: Actor, role: Actor['role'], admin = false) {
  if (actor.role !== role || (admin && !actor.admin)) throw new PortalError(403, 'This account cannot perform this action.');
}
function recordRef(collection: string, id: unknown) {
  const key = text(id, 'Record ID', 128);
  if (key.includes('/')) throw new PortalError(400, 'Invalid record ID.');
  return adminDb().collection(collection).doc(key);
}
function audit(actor: Actor, action: string, recordId: string) {
  return { actorId: actor.uid, actorName: actor.name, action, recordId, createdAt: stamp() };
}

export async function publicPortalAction(action: string, body: Body) {
  if (action === 'registerVendor') {
    const created = await createPortalAccount('vendor', body, 'self');
    return { ...created, token: await adminAuth().createCustomToken(created.uid, { portal: 'vendor' }) };
  }
  const role = choice(body.role, ['office', 'vendor'] as const);
  const id = identifier(role, body.identifier);
  const secret = text(body.password, 'Password', 128);
  const uid = await verifyPassword(role, id, secret);
  const member = await adminDb().collection(role === 'office' ? 'officeMembers' : 'vendorProfiles').doc(uid).get();
  if (!member.exists || member.data()?.active !== true) throw new PortalError(403, 'This portal account is inactive.');
  return { token: await adminAuth().createCustomToken(uid, { portal: role }) };
}

export async function portalAction(actor: Actor, action: string, body: Body) {
  const db = adminDb();
  if (action === 'deleteAccountData') {
    const collections = ['farms', 'cropCycles', 'pestDiagnoses', 'soilTests', 'weatherObservations', 'outbreakAlerts', 'recommendations', 'tasks', 'irrigationEvents', 'sprayEvents', 'marketPrices', 'marketPurchases', 'searchHistory', 'harvests', 'sales', 'expenses', 'simulationRuns', 'farmEvents', 'reports', 'officeCases', 'vendorListings', 'vendorLeads', 'vendorOrders', 'fieldPrograms', 'portalAudit'];
    for (const collectionName of collections) {
      const collectionRef = db.collection(collectionName);
      const snapshots = await Promise.all([
        collectionRef.where('userId', '==', actor.uid).get(),
        collectionName === 'vendorOrders' ? collectionRef.where('farmerId', '==', actor.uid).get() : Promise.resolve(null),
        collectionName === 'vendorOrders' ? collectionRef.where('vendorId', '==', actor.uid).get() : Promise.resolve(null),
        collectionName === 'portalAudit' ? collectionRef.where('actorId', '==', actor.uid).get() : Promise.resolve(null),
      ]);
      const refs = new Map(snapshots.flatMap((snapshot) => snapshot ? snapshot.docs.map((entry) => [entry.id, entry.ref] as const) : []));
      const entries = Array.from(refs.values());
      for (let index = 0; index < entries.length; index += 400) {
        const batch = db.batch();
        entries.slice(index, index + 400).forEach((ref) => batch.delete(ref));
        await batch.commit();
      }
    }
    await Promise.all([
      db.collection('users').doc(actor.uid).delete(),
      db.collection('officeMembers').doc(actor.uid).delete(),
      db.collection('vendorProfiles').doc(actor.uid).delete(),
    ]);
    return {};
  }
  if (action === 'metrics') {
    if (actor.role !== 'office' && actor.role !== 'vendor') throw new PortalError(403, 'Portal metrics require an operations account.');
    const [users, cases, listings, leads, orders] = await Promise.all([
      db.collection('users').get(), db.collection('officeCases').get(), db.collection('vendorListings').get(),
      db.collection('vendorLeads').get(), db.collection('vendorOrders').get(),
    ]);
    const profiles = users.docs.map((entry) => entry.data());
    const rolesOf = (profile: Record<string, any>) => Array.isArray(profile.portalRoles) ? profile.portalRoles : [profile.portalRole || 'farmer'];
    return { metrics: {
      farmers: profiles.filter((profile) => rolesOf(profile).includes('farmer')).length,
      vendors: profiles.filter((profile) => rolesOf(profile).includes('vendor')).length,
      officials: profiles.filter((profile) => profile.accountType === 'official').length,
      officeCases: cases.size,
      activeListings: listings.docs.filter((entry) => entry.data().status === 'Active').length,
      vendorLeads: leads.size,
      orders: orders.size,
    } };
  }
  if (action === 'listVendorData') {
    requireRole(actor, 'vendor');
    const [listings, leads, orders] = await Promise.all([
      db.collection('vendorListings').where('vendorId', '==', actor.uid).get(),
      db.collection('vendorLeads').where('vendorId', '==', actor.uid).get(),
      db.collection('vendorOrders').where('vendorId', '==', actor.uid).get(),
    ]);
    return { listings: listings.docs.map((entry) => ({ id: entry.id, ...entry.data() })), leads: leads.docs.map((entry) => ({ id: entry.id, ...entry.data() })), orders: orders.docs.map((entry) => ({ id: entry.id, ...entry.data() })) };
  }
  if (action === 'listOfficeData') {
    requireRole(actor, 'office');
    const caseQueries = actor.admin
      ? [db.collection('officeCases').get()]
      : [db.collection('officeCases').where('assignedTo', '==', actor.uid).get(), db.collection('officeCases').where('createdBy', '==', actor.uid).get()];
    const [cases, programs, officials] = await Promise.all([
      Promise.all(caseQueries), db.collection('fieldPrograms').where('officerId', '==', actor.uid).get(),
      actor.admin ? db.collection('officeMembers').get() : Promise.resolve(null),
    ]);
    const caseMap = new Map(cases.flatMap((snapshot) => snapshot.docs.map((entry) => [entry.id, entry] as const)));
    return { cases: Array.from(caseMap.values()).map((entry) => ({ id: entry.id, ...entry.data() })), programs: programs.docs.map((entry) => ({ id: entry.id, ...entry.data() })), officials: officials ? officials.docs.map((entry) => ({ uid: entry.id, ...entry.data() })) : [] };
  }
  if (action === 'listFarmers') {
    requireRole(actor, 'office');
    const users = await db.collection('users').get();
    const farmers = users.docs.filter((entry) => {
      const data = entry.data();
      const roles = Array.isArray(data.portalRoles) ? data.portalRoles : [data.portalRole || 'farmer'];
      return roles.includes('farmer');
    }).map((entry) => ({ id: entry.id, fullName: entry.data().fullName || 'Farmer', district: entry.data().district || '', state: entry.data().state || '' }));
    return { farmers };
  }
  if (action === 'createOfficial') {
    requireRole(actor, 'office', true);
    return createPortalAccount('office', body, actor.uid);
  }
  if (action === 'manageAccount') {
    requireRole(actor, 'office', true);
    const role = choice(body.role, ['office', 'vendor'] as const);
    const ref = recordRef(role === 'office' ? 'officeMembers' : 'vendorProfiles', body.uid);
    const member = await ref.get();
    if (!member.exists) throw new PortalError(404, 'Account not found.');
    if (member.data()?.admin === true) throw new PortalError(403, 'The owner account cannot be changed here.');
    if (typeof body.active === 'boolean') {
      // Membership checks revoke database access immediately, even for previously issued tokens.
      await ref.update({ active: body.active, updatedAt: stamp() });
      await adminAuth().updateUser(ref.id, { disabled: !body.active });
      if (!body.active) await adminAuth().revokeRefreshTokens(ref.id);
    } else {
      await adminAuth().updateUser(ref.id, { password: password(body.password) });
      await adminAuth().revokeRefreshTokens(ref.id);
    }
    await db.collection('portalAudit').add(audit(actor, 'Account access updated', ref.id));
    return {};
  }
  if (action === 'changePassword') {
    if (actor.role === 'farmer') throw new PortalError(403, 'Use farmer account settings.');
    const member = await db.collection(actor.role === 'office' ? 'officeMembers' : 'vendorProfiles').doc(actor.uid).get();
    const id = actor.role === 'office' ? member.data()?.officialId : member.data()?.email;
    const uid = await verifyPassword(actor.role, id, text(body.currentPassword, 'Current password', 128));
    if (uid !== actor.uid) throw new PortalError(403, 'Account mismatch.');
    await adminAuth().updateUser(uid, { password: password(body.password) });
    await adminAuth().revokeRefreshTokens(uid);
    return {};
  }
  if (action === 'saveVendorProfile') {
    requireRole(actor, 'vendor');
    await db.collection('vendorProfiles').doc(actor.uid).update({
      businessName: text(body.businessName, 'Business name'), phone: text(body.phone, 'Phone', 30),
      location: text(body.location, 'Service location'), updatedAt: stamp(),
    });
    return {};
  }
  if (action === 'saveListing') {
    requireRole(actor, 'vendor');
    const ref = body.id ? recordRef('vendorListings', body.id) : db.collection('vendorListings').doc();
    const profile = await db.collection('vendorProfiles').doc(actor.uid).get();
    const data = {
      product: text(body.product, 'Product'), category: choice(body.category, ['Mandi commodity', 'Farm input'] as const),
      location: text(body.location, 'Location'), price: number(body.price, 'Price', 0.01),
      unit: text(body.unit, 'Unit', 30), stock: number(body.stock, 'Stock'),
      status: choice(body.status, ['Active', 'Paused'] as const), description: text(body.description || '', 'Description', 1000, true),
      vendorId: actor.uid, userId: actor.uid, businessName: profile.data()?.businessName || actor.name, updatedAt: stamp(),
    };
    await db.runTransaction(async (tx) => {
      const old = await tx.get(ref);
      if (old.exists && old.data()?.vendorId !== actor.uid) throw new PortalError(403, 'This listing belongs to another vendor.');
      tx.set(ref, { ...data, createdAt: old.data()?.createdAt || stamp() });
    });
    return { id: ref.id };
  }
  if (action === 'requestOrder') {
    requireRole(actor, 'farmer');
    const listingRef = recordRef('vendorListings', body.listingId);
    const quantity = number(body.quantity, 'Quantity', 0.01);
    const delivery = text(body.delivery, 'Delivery address', 500);
    const phone = text(body.phone, 'Contact phone', 30);
    const order = db.collection('vendorOrders').doc();
    await db.runTransaction(async (tx) => {
      const listing = await tx.get(listingRef);
      const data = listing.data();
      if (!data || data.status !== 'Active') throw new PortalError(409, 'This listing is unavailable.');
      const vendor = await tx.get(db.collection('vendorProfiles').doc(data.vendorId));
      if (vendor.data()?.active !== true || quantity > data.stock) throw new PortalError(409, 'Supplier unavailable or insufficient stock.');
      tx.create(order, {
        vendorId: data.vendorId, farmerId: actor.uid, farmerName: actor.name, listingId: listing.id,
        product: data.product, unit: data.unit, quantity, unitPrice: data.price, total: Math.round(data.price * quantity * 100) / 100,
        delivery, phone, status: 'Requested', createdAt: stamp(), updatedAt: stamp(),
      });
      tx.create(db.collection('vendorLeads').doc(order.id), {
        vendorId: data.vendorId, userId: data.vendorId, farmerId: actor.uid, buyer: actor.name, product: data.product,
        quantity, location: delivery, phone, status: 'New', quote: '', orderId: order.id, createdAt: stamp(), updatedAt: stamp(),
      });
    });
    return { id: order.id };
  }
  if (action === 'updateOrder') {
    const ref = recordRef('vendorOrders', body.id);
    const status = choice(body.status, ['Accepted', 'Dispatched', 'Completed', 'Cancelled'] as const);
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const order = doc.data();
      if (!order) throw new PortalError(404, 'Order not found.');
      const vendor = actor.role === 'vendor' && order.vendorId === actor.uid;
      const farmerCancel = actor.role === 'farmer' && order.farmerId === actor.uid && order.status === 'Requested' && status === 'Cancelled';
      if (!vendor && !farmerCancel) throw new PortalError(403, 'You cannot change this order.');
      checkOrderTransition(order.status, status);
      const listingRef = db.collection('vendorListings').doc(order.listingId);
      const listing = await tx.get(listingRef);
      if (status === 'Accepted') {
        if (!listing.exists || listing.data()?.status !== 'Active' || listing.data()!.stock < order.quantity) throw new PortalError(409, 'Not enough active stock to accept this order.');
        tx.update(listingRef, { stock: FieldValue.increment(-order.quantity), updatedAt: stamp() });
      }
      if (status === 'Cancelled' && order.status === 'Accepted' && listing.exists) tx.update(listingRef, { stock: FieldValue.increment(order.quantity), updatedAt: stamp() });
      tx.update(ref, { status, updatedAt: stamp() });
      if (status === 'Completed' || status === 'Cancelled') tx.set(db.collection('vendorLeads').doc(ref.id), { status: 'Closed', updatedAt: stamp() }, { merge: true });
    });
    return {};
  }
  if (action === 'quoteLead') {
    requireRole(actor, 'vendor');
    const ref = recordRef('vendorLeads', body.id);
    await db.runTransaction(async (tx) => {
      const lead = await tx.get(ref);
      if (!lead.exists || lead.data()?.vendorId !== actor.uid) throw new PortalError(403, 'Lead not found for this vendor.');
      if (lead.data()?.status === 'Closed') throw new PortalError(409, 'This lead is closed.');
      tx.update(ref, { quote: text(body.quote, 'Quote / response', 1000), status: 'Quoted', updatedAt: stamp() });
    });
    return {};
  }
  if (action === 'createCase') {
    if (actor.role === 'vendor') throw new PortalError(403, 'Only farmers and officials may create cases.');
    const farmerId = actor.role === 'farmer' ? actor.uid : text(body.farmerId, 'Farmer ID', 128);
    const farmer = await recordRef('users', farmerId).get();
    if (!farmer.exists) throw new PortalError(404, 'Select a registered farmer.');
    const ref = await db.collection('officeCases').add({
      farmerId, farmer: farmer.data()?.fullName || 'Farmer', district: farmer.data()?.district || '',
      subject: text(body.subject, 'Subject', 200), description: text(body.description, 'Description', 2000),
      priority: choice(body.priority, ['High', 'Medium', 'Low'] as const), status: 'Pending',
      assignedTo: '', resolution: '', createdBy: actor.uid, userId: actor.uid, createdAt: stamp(), updatedAt: stamp(),
    });
    return { id: ref.id };
  }
  if (action === 'updateCase') {
    requireRole(actor, 'office');
    const ref = recordRef('officeCases', body.id);
    const existing = await ref.get();
    if (!existing.exists) throw new PortalError(404, 'Case not found.');
    if (!actor.admin && existing.data()?.assignedTo !== actor.uid && existing.data()?.createdBy !== actor.uid) throw new PortalError(403, 'This case is assigned to another official.');
    const status = choice(body.status, ['Pending', 'In review', 'Approved', 'Returned'] as const);
    const resolution = text(body.resolution || '', 'Resolution', 2000, true);
    if ((status === 'Approved' || status === 'Returned') && !resolution) throw new PortalError(400, 'Add a decision note for the farmer.');
    const batch = db.batch();
    batch.update(ref, { status, resolution, assignedTo: actor.uid, assignedName: actor.name, updatedAt: stamp() });
    batch.create(db.collection('portalAudit').doc(), audit(actor, `Case ${status}`, ref.id));
    await batch.commit();
    return {};
  }
  if (action === 'saveProgram') {
    requireRole(actor, 'office');
    const ref = body.id ? recordRef('fieldPrograms', body.id) : db.collection('fieldPrograms').doc();
    if (body.id) {
      const existing = await ref.get();
      if (!existing.exists || existing.data()?.officerId !== actor.uid) throw new PortalError(403, 'This field program belongs to another official.');
    }
    const date = text(body.date, 'Date', 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new PortalError(400, 'Enter a valid program date.');
    await ref.set({ title: text(body.title, 'Title'), district: text(body.district, 'District'), date,
      description: text(body.description, 'Description', 2000), status: choice(body.status, ['Scheduled', 'Active', 'Completed'] as const),
      officerId: actor.uid, officerName: actor.name, updatedAt: stamp(),
    }, { merge: true });
    return { id: ref.id };
  }
  if (action === 'listFarmerListings') {
    requireRole(actor, 'farmer');
    const listings = await db.collection('vendorListings').where('status', '==', 'Active').get();
    return { listings: listings.docs.map((entry) => ({ id: entry.id, ...entry.data() })) };
  }
  throw new PortalError(400, 'Unknown portal action.');
}
