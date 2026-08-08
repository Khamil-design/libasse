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
    "pantalon-enfant": "Pantalons"
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
    "pantalon-enfant": ["pantalon-enfant"]
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

    article.innerHTML = `
        ${badge}
        <img src="${productImage(produit)}" alt="${produit.nom}">
        <h3>${produit.nom}</h3>
        <p>${produit.prix.actuel} ${produit.prix.devise}</p>
    `;

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
