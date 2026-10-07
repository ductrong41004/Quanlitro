const API_KEY = 'AIzaSyB76SscNrtakRJXfTrWn-ABGuMJSNdGhmc';
const PROJECT_ID = 'quan-ly-phong-tro-ec03c';
const BASE_FIRESTORE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const LOCAL_BACKEND = 'http://localhost:8080/api';

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const k of Object.keys(val)) {
      if (val[k] !== undefined) fields[k] = toFirestoreValue(val[k]);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toDoc(obj) {
  const fields = {};
  for (const k of Object.keys(obj)) {
    if (obj[k] !== undefined) fields[k] = toFirestoreValue(obj[k]);
  }
  return { fields };
}

async function writeDoc(collection, id, data) {
  const url = `${BASE_FIRESTORE}/${collection}/${encodeURIComponent(id)}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toDoc(data))
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Write failed for ${collection}/${id}: ${err}`);
  }
  return await res.json();
}

async function deleteDoc(collection, id) {
  const url = `${BASE_FIRESTORE}/${collection}/${encodeURIComponent(id)}?key=${API_KEY}`;
  await fetch(url, { method: 'DELETE' });
}

async function runMigration() {
  console.log('--- BAT DAU CHUYEN DU LIEU VAO FIREBASE FIRESTORE ---');

  // Clean test doc
  await deleteDoc('phong', 'test_101').catch(() => {});

  // 1. Cau Hinh
  console.log('\n[1/5] Dang chuyen Cau Hinh...');
  const chRes = await fetch(`${LOCAL_BACKEND}/cau-hinh`).then(r => r.json());
  if (chRes.success && chRes.data) {
    await writeDoc('cau_hinh', 'main', chRes.data);
    console.log(' -> Da chuyen thanh cong Cau Hinh:', Object.keys(chRes.data).length, 'keys');
  }

  // 2. Phong
  console.log('\n[2/5] Dang chuyen Phong...');
  const phongRes = await fetch(`${LOCAL_BACKEND}/phong`).then(r => r.json());
  const phongList = phongRes.data || [];
  for (let i = 0; i < phongList.length; i++) {
    const p = phongList[i];
    await writeDoc('phong', String(p.id), p);
    if ((i + 1) % 15 === 0 || i === phongList.length - 1) {
      console.log(` -> Da chuyen ${i + 1}/${phongList.length} phong`);
    }
  }

  // 3. Khach Thue
  console.log('\n[3/5] Dang chuyen Khach Thue...');
  const khachRes = await fetch(`${LOCAL_BACKEND}/khach-thue`).then(r => r.json());
  const khachList = khachRes.data || [];
  for (let i = 0; i < khachList.length; i++) {
    const k = khachList[i];
    await writeDoc('khach_thue', String(k.id), k);
    if ((i + 1) % 25 === 0 || i === khachList.length - 1) {
      console.log(` -> Da chuyen ${i + 1}/${khachList.length} khach thue`);
    }
  }

  // 4. Hop Dong
  console.log('\n[4/5] Dang chuyen Hop Dong...');
  const hdRes = await fetch(`${LOCAL_BACKEND}/hop-dong`).then(r => r.json());
  const hdList = hdRes.data || [];
  for (let i = 0; i < hdList.length; i++) {
    const hd = hdList[i];
    await writeDoc('hop_dong', String(hd.id), hd);
    if ((i + 1) % 15 === 0 || i === hdList.length - 1) {
      console.log(` -> Da chuyen ${i + 1}/${hdList.length} hop dong`);
    }
  }

  // 5. Hoa Don
  console.log('\n[5/5] Dang chuyen Hoa Don...');
  const hoaDonRes = await fetch(`${LOCAL_BACKEND}/hoa-don`).then(r => r.json());
  const hoaDonList = hoaDonRes.data || [];
  for (let i = 0; i < hoaDonList.length; i++) {
    const hd = hoaDonList[i];
    await writeDoc('hoa_don', String(hd.id), hd);
    if ((i + 1) % 50 === 0 || i === hoaDonList.length - 1) {
      console.log(` -> Da chuyen ${i + 1}/${hoaDonList.length} hoa don`);
    }
  }

  console.log('\n🎉 TOAN BO DU LIEU DA DUOC CHUYEN LEN GOOGLE FIREBASE THANH CONG 100%!');
}

runMigration().catch(err => {
  console.error('Loi khi chuyen du lieu:', err);
});
