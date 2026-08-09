/* ==========================================================
   LIBASSE
   CATALOGUE — fonctions partagées entre les pages
========================================================== */

/* Libellé affiché pour chaque catégorie */
const CATEGORY_LABELS = {
    robe: "Robes",
    chemise: "Chemises",
    chemisier: "Chemisiers",
    jupe: "Jupes",
    manteau: "Manteaux",
    pantalon: "Pantalons",
    teeshirt: "Tee-shirts",
    blazer: "Blazers",
    "blazer-enfant": "Blazers",
    "robe-chemise-enfant": "Robes-chemises",
    "costume-enfant": "Costumes",
    "pantalon-enfant": "Pantalons",
    "gilet-enfant": "Gilets"
};

/*
   Regroupement des valeurs `categorie` du catalogue sous chaque
   entrée de menu. Les trenchs (categorie: "trench") sont
   présentés sous "Manteaux" dans la navigation, sans toucher à
   la donnée d'origine.
*/
const CATEGORY_GROUPS = {
    robe: ["robe"],
    chemise: ["chemise"],
    chemisier: ["chemisier"],
    jupe: ["jupe"],
    manteau: ["manteau", "trench"],
    pantalon: ["pantalon"],
    teeshirt: ["teeshirt"],
    blazer: ["blazer"],
    "blazer-enfant": ["blazer-enfant"],
    "robe-chemise-enfant": ["robe-chemise-enfant"],
    "costume-enfant": ["costume-enfant"],
    "pantalon-enfant": ["pantalon-enfant"],
    "gilet-enfant": ["gilet-enfant"]
};

/* ======================================================
   Chargement du catalogue
====================================================== */

async function loadCatalogue() {

    const response = await fetch("data/catalogue.json");

    if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.catalogue.produits;

}

/* ======================================================
   Image principale d'un produit (1ère variante)
====================================================== */

function productImage(produit) {

    const variante = produit.variantes && produit.variantes[0];

    if (!variante || !produit.imageBase || !variante.dossier) {
        return "";
    }

    return `${produit.imageBase}/${variante.dossier}/principale.jpg`;

}

/* ======================================================
   Slug de catégorie (nav) <-> valeur `categorie` du catalogue
====================================================== */

function categorySlugFor(categorie) {

    for (const [slug, values] of Object.entries(CATEGORY_GROUPS)) {
        if (values.includes(categorie)) return slug;
    }

    return categorie;

}

function categoryLabelFor(categorie) {

    const slug = categorySlugFor(categorie);
    return CATEGORY_LABELS[slug] || categorie;

}

const GENRE_LABELS = {
    homme: "Hommes",
    femme: "Femmes",
    enfant: "Enfants"
};

function productsInGenre(produits, genre) {

    const mixteApplicable = genre === "homme" || genre === "femme";

    return produits.filter(p =>
        p.genre === genre || (mixteApplicable && p.genre === "mixte")
    );

}

function productsInCategory(produits, slug) {

    if (slug === "nouveautes") {
        return produits.filter(p => p.etat && p.etat.nouveau);
    }

    const values = CATEGORY_GROUPS[slug] || [slug];
    return produits.filter(p => values.includes(p.categorie));

}

/* ======================================================
   Carte produit réutilisable (accueil + page catégorie)
====================================================== */

function buildProductCard(produit) {

    const link = document.createElement("a");
    link.href = `produit.html?id=${encodeURIComponent(produit.slug)}`;
    link.className = "product-card-link";

    const article = document.createElement("article");
    article.className = "product-card";

    const badge = (produit.etat && produit.etat.nouveau)
        ? '<span class="product-badge-new">Nouveau</span>'
        : "";

    const favActive = isFavorite(produit.slug) ? "active" : "";

    article.innerHTML = `
        ${badge}
        <button type="button" class="product-favorite-btn ${favActive}" aria-label="Ajouter aux favoris">
            <i class="bi bi-heart-fill"></i>
        </button>
        <img src="${productImage(produit)}" alt="${produit.nom}">
        <h3>${produit.nom}</h3>
        <p>${produit.prix.actuel} ${produit.prix.devise}</p>
    `;

    const favBtn = article.querySelector(".product-favorite-btn");
    favBtn.addEventListener("click", event => {

        event.preventDefault();
        event.stopPropagation();

        const nowActive = toggleFavorite(produit.slug);
        favBtn.classList.toggle("active", nowActive);

    });

    link.appendChild(article);
    return link;

}

/* ======================================================
   Panier (localStorage, partagé par toutes les pages)
====================================================== */

const CART_STORAGE_KEY = "libasse-cart";

function getCart() {

    try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch {
        return [];
    }

}

function saveCart(cart) {

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));

}

function cartItemCount(cart) {

    return cart.reduce((sum, item) => sum + item.quantite, 0);

}

function cartSubtotal(cart) {

    return cart.reduce((sum, item) => sum + (item.prixUnitaire * item.quantite), 0);

}

function updateCartBadge() {

    const badge = document.getElementById("cartCount");
    if (!badge) return;

    badge.textContent = cartItemCount(getCart());

}

/* ======================================================
   Favoris (localStorage, partagé par toutes les pages)
====================================================== */

const FAVORITES_STORAGE_KEY = "libasse-favorites";

function getFavorites() {

    try {
        return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)) || [];
    } catch {
        return [];
    }

}

function saveFavorites(favorites) {

    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));

}

function isFavorite(slug) {

    return getFavorites().includes(slug);

}

function toggleFavorite(slug) {

    let favorites = getFavorites();

    if (favorites.includes(slug)) {
        favorites = favorites.filter(s => s !== slug);
    } else {
        favorites.push(slug);
    }

    saveFavorites(favorites);
    updateFavoritesBadge();

    return favorites.includes(slug);

}

function updateFavoritesBadge() {

    const badge = document.getElementById("favoritesCount");
    if (!badge) return;

    badge.textContent = getFavorites().length;

}

/* ======================================================
   Barre de recherche (partagée par toutes les pages)
====================================================== */

function normalizeSearchText(text) {

    return (text || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

}

function searchProducts(produits, query) {

    const term = normalizeSearchText(query).trim();
    if (!term) return [];

    return produits.filter(p => {
        const haystack = normalizeSearchText(
            `${p.nom} ${p.description?.courte || ""} ${p.categorie}`
        );
        return haystack.includes(term);
    });

}

function initSearchBar() {

    const toggle = document.getElementById("searchToggle");
    const bar = document.getElementById("searchBar");
    const form = document.getElementById("searchForm");
    const input = document.getElementById("searchInput");

    if (!toggle || !bar) return;

    toggle.addEventListener("click", () => {

        bar.classList.toggle("active");

        if (bar.classList.contains("active") && input) {
            input.focus();
        }

    });

    if (form && input) {
        form.addEventListener("submit", event => {

            event.preventDefault();

            const query = input.value.trim();
            if (!query) return;

            window.location.href = `categorie.html?q=${encodeURIComponent(query)}`;

        });
    }

}

/* ======================================================
   Newsletter (Formspree)
====================================================== */

function initNewsletterForm() {

    const form = document.getElementById("newsletterForm");
    const messageEl = document.getElementById("newsletterMessage");

    if (!form) return;

    const endpoint = form.dataset.formspree;
    const button = form.querySelector("button[type='submit']");
    const input = form.querySelector("input[type='email']");

    form.addEventListener("submit", async event => {

        event.preventDefault();

        if (!endpoint || !input) return;

        const originalLabel = button ? button.textContent : "";

        if (button) {
            button.disabled = true;
            button.textContent = "Envoi...";
        }

        if (messageEl) {
            messageEl.textContent = "";
            messageEl.className = "newsletter-message";
        }

        try {

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Accept": "application/json" },
                body: new FormData(form)
            });

            if (response.ok) {

                if (messageEl) {
                    messageEl.textContent = "Merci ! Votre inscription est confirmée.";
                    messageEl.classList.add("success");
                }

                form.reset();

            } else {
                throw new Error("Erreur d'envoi");
            }

        }

        catch (error) {

            console.error(error);

            if (messageEl) {
                messageEl.textContent = "Une erreur est survenue. Merci de réessayer.";
                messageEl.classList.add("error");
            }

        }

        finally {

            if (button) {
                button.disabled = false;
                button.textContent = originalLabel;
            }

        }

    });

}

document.addEventListener("DOMContentLoaded", () => {
    updateFavoritesBadge();
    initSearchBar();
    initNewsletterForm();
});
