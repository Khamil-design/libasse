/* ==========================================================
   LIBASSE
   PAGE CATÉGORIE
========================================================== */

function sortProducts(produits, mode) {

    const sorted = [...produits];

    switch (mode) {

        case "prix-asc":
            sorted.sort((a, b) => a.prix.actuel - b.prix.actuel);
            break;

        case "prix-desc":
            sorted.sort((a, b) => b.prix.actuel - a.prix.actuel);
            break;

        case "nom":
            sorted.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
            break;

        // "pertinence" : ordre du catalogue, inchangé

    }

    return sorted;

}

function renderGrid(container, produits, emptyMessage) {

    container.innerHTML = "";

    if (produits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-bag"></i>
                <h3>Aucun produit ici pour le moment</h3>
                <span>${emptyMessage}</span>
            </div>
        `;
        return;
    }

    produits.forEach(produit => {
        container.appendChild(buildProductCard(produit));
    });

}

async function initCategoryPage() {

    updateCartBadge();

    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    const genre = params.get("genre");
    const query = params.get("q");
    const favorisOnly = cat === "favoris";

    const titleEl = document.getElementById("categoryTitle");
    const breadcrumbEl = document.getElementById("breadcrumbCategory");
    const countEl = document.getElementById("resultCount");
    const grid = document.getElementById("categoryGrid");
    const sortSelect = document.getElementById("sortSelect");

    if (!cat && !genre && !query) {
        if (titleEl) titleEl.textContent = "Catégorie introuvable";
        if (countEl) countEl.textContent = "Choisissez une catégorie depuis le menu ci-dessus.";
        if (grid) grid.innerHTML = "";
        return;
    }

    const label = query
        ? `Résultats pour « ${query} »`
        : favorisOnly
        ? "Mes favoris"
        : genre
        ? (GENRE_LABELS[genre] || genre)
        : (cat === "nouveautes" ? "Nouveautés" : (CATEGORY_LABELS[cat] || cat));

    const emptyMessage = query
        ? "Aucun produit ne correspond à cette recherche. Essayez un autre mot-clé."
        : favorisOnly
        ? "Vous n'avez pas encore ajouté de favoris. Cliquez sur le cœur d'un produit pour l'enregistrer ici."
        : genre
        ? "Cet univers n'a pas encore de pièces en ligne. Revenez bientôt !"
        : "Cette catégorie n'a pas encore de pièces en ligne. Revenez bientôt !";

    if (titleEl) titleEl.textContent = label;
    if (breadcrumbEl) breadcrumbEl.textContent = label;
    document.title = `${label} | Libasse`;

    try {

        const produits = await loadCatalogue();
        const filtered = query
            ? searchProducts(produits, query)
            : favorisOnly
            ? produits.filter(p => isFavorite(p.slug))
            : genre
            ? productsInGenre(produits, genre)
            : productsInCategory(produits, cat);

        const renderSorted = () => {
            const mode = sortSelect ? sortSelect.value : "pertinence";
            renderGrid(grid, sortProducts(filtered, mode), emptyMessage);
        };

        if (countEl) {
            countEl.textContent = filtered.length > 1
                ? `${filtered.length} produits`
                : `${filtered.length} produit`;
        }

        renderSorted();

        if (sortSelect) {
            sortSelect.addEventListener("change", renderSorted);
        }

    }

    catch (error) {

        console.error(error);
        if (countEl) countEl.textContent = "";
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h3>Impossible de charger le catalogue</h3>
                    <span>Merci de réessayer dans un instant.</span>
                </div>
            `;
        }

    }

}

document.addEventListener("DOMContentLoaded", initCategoryPage);
