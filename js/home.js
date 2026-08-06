/* ==========================================================
   LIBASSE
   PAGE D'ACCUEIL
========================================================== */

async function initHomePage() {

    updateCartBadge();

    const container = document.getElementById("newArrivalsGrid");
    if (!container) return;

    try {

        const produits = await loadCatalogue();

        // "Nouveautés" en priorité, complétées par le reste du
        // catalogue si moins de 4 produits sont marqués nouveaux.
        const nouveautes = produits.filter(p => p.etat && p.etat.nouveau);
        const autres = produits.filter(p => !(p.etat && p.etat.nouveau));
        const selection = [...nouveautes, ...autres].slice(0, 8);

        container.innerHTML = "";

        if (selection.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-bag"></i>
                    <h3>Aucun produit pour le moment</h3>
                    <span>Revenez bientôt pour découvrir nos prochaines collections.</span>
                </div>
            `;
            return;
        }

        selection.forEach(produit => {
            container.appendChild(buildProductCard(produit));
        });

    }

    catch (error) {
        console.error(error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Impossible de charger le catalogue</h3>
                <span>Merci de réessayer dans un instant.</span>
            </div>
        `;
    }

}

document.addEventListener("DOMContentLoaded", initHomePage);
