document.getElementById("shortenForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const originalUrl = document.getElementById("originalUrl").value;
  try {
    const response = await fetch("/shorten", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ originalUrl }),
    });

    const data = await response.json();
    if (data.error && data.shortUrl) {
      document.getElementById(
        "result"
      ).innerHTML = `<p class="error">⚠️ ${data.error}: <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a></p>`;
    } else if (data.shortUrl) {
      document.getElementById(
        "result"
      ).innerHTML = `<p class="short-url">Short URL created: <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a></p>`;
      
      document.getElementById("urlsListTable").style.display = "none";
      listUrls();
    } else {
      document.getElementById(
        "result"
      ).innerHTML = `<p class="error">${data.error}</p>`;
    }

    setTimeout(() => {
      document.getElementById("result").innerHTML = "";
      document.getElementById("originalUrl").value = "";
    }, 5000);
  } catch (error) {
    console.log("Error in shortening url: ", error);
    document.getElementById(
      "result"
    ).innerHTML = `<p class="error">An error occurred, please try again later.</p>`;
  }
});

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

                a = document.createElement("a");
                a.target = "_blank";
                a.href = data.urls[i].original_url;
                a.appendChild(document.createTextNode(data.urls[i].original_url));
                originalUrlTd.appendChild(a);

                validUntilTd.innerHTML = data.urls[i].valid_until ? new Date(data.urls[i].valid_until).toLocaleString() : "-";
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
})
