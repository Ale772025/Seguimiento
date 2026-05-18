const url = 'https://script.google.com/macros/s/AKfycbz2u12xwvMbfkvShUlrvf536JSNw43AUcJbvWdqlOVT42tAgLAHI-vX7u63u-EM9uRW/exec';

async function test() {
  const getRes = await fetch(url);
  const data = await getRes.json();
  console.log("GET data:", JSON.stringify(data, null, 2));
}

test();
