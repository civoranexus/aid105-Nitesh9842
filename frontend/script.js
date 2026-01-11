const API_URL = 'http://localhost:5000/api';

document.getElementById("profileForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const state = document.getElementById("state").value;
    const income = document.getElementById("income").value;
    const category = document.getElementById("category").value;

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "<p>Loading recommendations...</p>";

    try {
        // Make API call to backend
        const response = await fetch(`${API_URL}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                state: state,
                income: parseInt(income),
                category: category
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        resultsDiv.innerHTML = "";

        if (data.success && data.schemes.length > 0) {
            data.schemes.forEach(scheme => {
                const card = document.createElement("div");
                card.className = "card";
                card.innerHTML = `
                    <h3>${scheme.scheme_name}</h3>
                    <p><strong>Category:</strong> ${scheme.category}</p>
                    <p><strong>Eligibility Score:</strong> ${scheme.score}</p>
                    <p><strong>Last Updated:</strong> ${scheme.last_updated}</p>
                `;
                resultsDiv.appendChild(card);
            });
        } else {
            resultsDiv.innerHTML = "<p>No schemes found for your profile. Try adjusting your criteria.</p>";
        }

    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = `
            <p style="color: red;">
                Error connecting to backend. Please make sure the backend server is running on port 5000.
                <br><br>
                Error details: ${error.message}
            </p>
        `;
    }
});
