async function checkUrl(url) {
  try {
    const res = await fetch(url);
    console.log(`[${res.status}] ${url}`);
  } catch (err) {
    console.log(`[ERROR] ${url} : ${err.message}`);
  }
}

async function run() {
  await checkUrl('http://localhost:8081/');
  await checkUrl('http://localhost:8081/admin');
  await checkUrl('http://localhost:8081/search/admin');
  await checkUrl('http://localhost:8081/latest-jobs');
  await checkUrl('http://localhost:8081/search');
}

run();
