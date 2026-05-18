const url = 'https://script.google.com/macros/s/AKfycbz2u12xwvMbfkvShUlrvf536JSNw43AUcJbvWdqlOVT42tAgLAHI-vX7u63u-EM9uRW/exec';

async function test() {
  const res = await fetch(url, {
    method: 'POST',
    // We cannot use no-cors in node fetch if we want to see the response, but GAS allows cors from everywhere actually, 
    // it's just the browser that blocks if GAS redirects. Node fetch follows redirects.
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sheet: 'Estudiantes',
      action: 'update',
      id: "1779069301906", // The ID of the last student
      row: ["1779069301906", "fff_updated", "3A", "saass", "2A", "2026-08-01T03:00:00.000Z", "Aprobado"]
    })
  });
  const data = await res.text();
  console.log("POST result:", data);
}

test();
