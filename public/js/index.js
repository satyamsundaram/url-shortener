document.getElementById("shortenForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const originalUrl = document.getElementById("originalUrl").value;
  const validUntil = document.getElementById("validUntil").value;
  const maxVisits = document.getElementById("maxVisits").value;
  try {
    const response = await fetch("/shorten", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ originalUrl, validUntil, maxVisits }),
    });

    document.getElementById("result").innerHTML = "";

    const data = await response.json();
    if (data.error && data.shortUrl) {
      document.getElementById(
        "result"
      ).innerHTML = `<p class="error">⚠️ ${data.error}: <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a> <i class="fa-solid fa-copy" onclick="copyToClipboard('${data.shortUrl}', 1)"></i></p>`;
    } else if (data.shortUrl) {
      document.getElementById(
        "result"
      ).innerHTML = `<p class="short-url">Short URL created: <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a> <i class="fa-solid fa-copy" onclick="copyToClipboard('${data.shortUrl}', 1)"></i></p>`;
      
      document.getElementById("urlsListTable").style.display = "none";
      listUrls();
    } else {
      document.getElementById(
        "result"
      ).innerHTML = `<p class="error">${data.error}</p>`;
    }

    document.getElementById("originalUrl").value = "";
    document.getElementById("validUntil").value = "";
    document.getElementById("maxVisits").value = "";
  } catch (error) {
    console.log("Error in shortening url: ", error);
    document.getElementById(
      "result"
    ).innerHTML = `<p class="error">An error occurred, please try again later.</p>`;
  }
});

const copyToClipboard = (url, isShortUrl) => {
  if (isShortUrl) url = window.location.origin + "/" + url;
  navigator.clipboard.writeText(url);
  document.getElementById("notification").innerHTML = "Copied to clipboard!";
  document.getElementById("notification").style.display = "block";
  
  setTimeout(() => {
    document.getElementById("notification").innerHTML = "";
    document.getElementById("notification").style.display = "none";
  }, 1000);
}

const truncate = (url, maxLength = 30) => {
  return (url.length > maxLength) ?
    url.substring(0, maxLength - 1) + "…" : url;
}

const listUrls = async () => {
    try {
        const response = await fetch("/listurls", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const data = await response.json();
        if (!data.error) {
            const tbodyRef = document.getElementById("urlsListTable").getElementsByTagName("tbody")[0];
            tbodyRef.innerHTML = "";
            for (let i = 0; i < data.urls.length; i++) {
                const row = document.createElement("tr");
                
                const shortUrlTd = document.createElement("td");
                shortUrlTd.scope = "row";
                shortUrlTd.setAttribute("data-label", "Short url");
                
                const originalUrlTd = document.createElement("td");
                originalUrlTd.setAttribute("data-label", "Original url");

                const validUntilTd = document.createElement("td");
                validUntilTd.setAttribute("data-label", "Valid until");

                const maxVisitsTd = document.createElement("td");
                maxVisitsTd.setAttribute("data-label", "Max visits");

                const visitsTd = document.createElement("td");
                visitsTd.setAttribute("data-label", "Visit count");

                let a = document.createElement("a");
                a.target = "_blank";
                a.href = window.location.origin + "/" + data.urls[i].short_url;
                a.appendChild(document.createTextNode(data.urls[i].short_url));
                shortUrlTd.appendChild(a);

                let copyBtn = document.createElement("i");
                copyBtn.classList.add("fa-solid");
                copyBtn.classList.add("fa-copy");
                copyBtn.onclick = () => copyToClipboard(data.urls[i].short_url, 1);
                shortUrlTd.appendChild(document.createTextNode(" "));
                shortUrlTd.appendChild(copyBtn);

                a = document.createElement("a");
                a.target = "_blank";
                a.href = data.urls[i].original_url;
                a.appendChild(document.createTextNode(truncate(data.urls[i].original_url)));
                originalUrlTd.appendChild(a);

                // let copyBtn2 = document.createElement("i");
                // copyBtn2.classList.add("fa-solid");
                // copyBtn2.classList.add("fa-copy");
                // copyBtn2.onclick = () => copyToClipboard(data.urls[i].original_url, 0);
                // originalUrlTd.appendChild(document.createTextNode(" "));
                // originalUrlTd.appendChild(copyBtn2);

                validUntilTd.innerHTML = data.urls[i].valid_until ? new Date(data.urls[i].valid_until).toLocaleDateString() : "-";
                maxVisitsTd.innerHTML = data.urls[i].max_visits ? data.urls[i].max_visits : "-";
                visitsTd.innerHTML = data.urls[i].visit_count ? data.urls[i].visit_count : "-";
                
                row.appendChild(shortUrlTd);
                row.appendChild(originalUrlTd);
                row.appendChild(validUntilTd);
                row.appendChild(maxVisitsTd);
                row.appendChild(visitsTd);
                
                tbodyRef.appendChild(row);
            }

            document.getElementById("urlsListTable").style.display = "block";
        }
    } catch (error) {
        console.log("Error in shortening url: ", error);
        document.getElementById("urlsList").innerHTML = `<p class="error">An error occurred, please try again later.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    listUrls();
    document.getElementById("year").textContent = new Date().getFullYear();
    document.getElementById("validUntil").setAttribute("min", new Date().toISOString().split("T")[0]);
})
