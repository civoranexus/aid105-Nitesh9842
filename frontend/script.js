document.getElementById("profileForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const state = document.getElementById("state").value;
    const income = document.getElementById("income").value;
    const category = document.getElementById("category").value;

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    // Simulated recommendations
    const schemes = [
        { name: "PM Kisan Samman Nidhi", category: "Agriculture", score: 80 },
        { name: "PM Awas Yojana", category: "Housing", score: 70 }
    ];

    schemes.forEach(scheme => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <h3>${scheme.name}</h3>
            <p>Category: ${scheme.category}</p>
            <p>Eligibility Score: ${scheme.score}</p>
        `;
        resultsDiv.appendChild(card);
    });
});
