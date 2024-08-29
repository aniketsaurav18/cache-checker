async function handleCache() {
  const caturl = "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg";
  const contentUrl = "/custom-content";
  const cacheName = "pwa-assets";
  const target = document.getElementById("cache-container");
  const imagetarget = document.getElementById("cat-img");
  const errordiv = document.getElementById("error-div");
  errordiv.innerHTML = ''; // Clear previous errors

  let errorFound = false;

  // Check for cookie support
  if (!navigator.cookieEnabled) {
    errordiv.innerHTML += "<div>Error: Browser blocked cookies.</div>";
    errorFound = true;
  }

  if (!errorFound) {
    errordiv.innerHTML = "<div>Cookies not blocked</div>";
  }

  try {
    if ('caches' in window) {
      let cache;
      try {
        cache = await caches.open(cacheName);
      } catch (cacheOpenError) {
        errordiv.innerHTML += `<div>Error opening cache: ${cacheOpenError.message}</div>`;
        throw cacheOpenError;
      }

      let contentCached, imageCached;
      try {
        contentCached = await cache.match(contentUrl);
        imageCached = await cache.match(caturl);
      } catch (cacheMatchError) {
        errordiv.innerHTML += `<div>Error matching cache: ${cacheMatchError.message}</div>`;
        throw cacheMatchError;
      }

      if (!contentCached || !imageCached) {
        errordiv.innerHTML += "<div>Cache empty or incomplete. Fetching from network...</div>";
        
        try {
          const catImageResponse = await fetch(caturl);
          if (!catImageResponse.ok) throw new Error('Failed to fetch image');
          
          try {
            await cache.put(contentUrl, new Response(JSON.stringify({key:"Hello, this is cached message"})));
            await cache.put(caturl, catImageResponse.clone());
            errordiv.innerHTML += "<div>Cache updated with new data.</div>";
          } catch (cachePutError) {
            errordiv.innerHTML += `<div>Error updating cache: ${cachePutError.message}</div>`;
            throw cachePutError;
          }
          
          try {
            contentCached = await cache.match(contentUrl);
            imageCached = await cache.match(caturl);
          } catch (cacheRematchError) {
            errordiv.innerHTML += `<div>Error re-matching cache after update: ${cacheRematchError.message}</div>`;
            throw cacheRematchError;
          }
        } catch (fetchError) {
          errordiv.innerHTML += `<div>Error fetching or caching data: ${fetchError.message}</div>`;
          return; 
        }
      } else {
        errordiv.innerHTML += "<div>Data retrieved from cache.</div>";
      }

      // Display data from cache
      if (contentCached && imageCached) {
        try {
          const contentData = await contentCached.json();
          const imageBlob = await imageCached.blob();
          
          target.innerText = contentData.key;
          imagetarget.src = URL.createObjectURL(imageBlob);
        } catch (dataProcessError) {
          errordiv.innerHTML += `<div>Error processing cached data: ${dataProcessError.message}</div>`;
          throw dataProcessError;
        }
      } else {
        throw new Error('Failed to retrieve data from cache');
      }
    } else {
      errordiv.innerHTML += "<div>Cache API not available.</div>";
    }
  } catch (error) {
    errordiv.innerHTML += `<div>Unexpected error: ${error.message}</div>`;
  }
}

const handleCookie = () => {
  const cookieContainer = document.getElementById("cookie-container");
  document.cookie = "message=This message is from cookie";
  const cookie = document.cookie.split("; ").find((row) => row.startsWith("message="));
  cookieContainer.innerText = cookie ? cookie.split("=")[1] : "Cookie can't be initialized";
};

handleCache();
handleCookie();

document.getElementById('clear-btn').addEventListener('click', () => {
  // Clear cookies
  const cookies = document.cookie.split(";");

  cookies.forEach(cookie => {
    const [name] = cookie.split("=");
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });

  // Clear cache and reload the page
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(cacheName => {
        return caches.delete(cacheName);
      }));
    }).then(() => {
      alert('Cookies and cache have been cleared.');
      window.location.reload(true);
    });
  } else {
    alert('Cache clearing is not supported in this browser.');
    window.location.reload(true);
  }
});
