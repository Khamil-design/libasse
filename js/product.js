/* ==========================================================
   LIBASSE
   PRODUCT ENGINE V3
========================================================== */

const CART_STORAGE_KEY = "libasse-cart";

class Product {

    constructor(productId) {

        this.productId = productId;
        this.catalogue = null;
        this.data = null;
        this.currentColor = null;
        this.currentSize = null;
        this.zoomHandlers = null;

    }

    /* ======================================================
       Chargement du catalogue
    ====================================================== */

    async load() {

        try {

            const response =
                await fetch("data/catalogue.json");

            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            this.catalogue = await response.json();

            this.data =
                this.catalogue.catalogue.produits.find(
                    produit => produit.slug === this.productId
                );

            if (!this.data) {
                throw new Error(`Produit "${this.productId}" introuvable.`);
            }

            if (!this.data.variantes || this.data.variantes.length === 0) {
                throw new Error("Aucune variante disponible.");
            }

            this.currentColor = this.data.variantes[0];
            this.currentSize = null;

            this.render();

            this.installColorEvents();
            this.installThumbnailEvents();
            this.installSizeEvents();
            this.installQuantityEvents();
            this.installPurchaseEvents();
            this.installZoom();

            this.updateCartBadge();

        }

        catch (error) {

            console.error(error);
            this.renderError(error);

        }

    }

    /* ======================================================
       Message d'erreur visible (produit introuvable, etc.)
    ====================================================== */

    renderError(error) {

        const title = document.getElementById("productTitle");
        if (title) title.textContent = "Produit indisponible";

        const shortDesc = document.getElementById("productShortDescription");
        if (shortDesc) {
            shortDesc.textContent =
                "Ce produit n'a pas pu être chargé. Vérifiez le lien utilisé pour accéder à cette page.";
        }

    }

    /* ======================================================
       Affichage général
    ====================================================== */

    render() {

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText("productTitle", this.data.nom);
        setText("breadcrumbProduct", this.data.nom);
        setText("productReference", this.data.reference || "--");
        setText("productShortDescription", this.data.description.courte);
        setText("productDescription", this.data.description.longue);

        const breadcrumbCategory = document.getElementById("breadcrumbCategory");
        if (breadcrumbCategory && typeof categorySlugFor === "function") {
            breadcrumbCategory.href = `categorie.html?cat=${categorySlugFor(this.data.categorie)}`;
            breadcrumbCategory.textContent = categoryLabelFor(this.data.categorie);
        }


        const price = `${this.data.prix.actuel} ${this.data.prix.devise}`;
        setText("productPrice", price);
        setText("purchasePrice", price);

        const oldPriceEl = document.getElementById("oldPrice");
        if (oldPriceEl) {
            if (this.data.prix.ancien) {
                oldPriceEl.textContent = `${this.data.prix.ancien} ${this.data.prix.devise}`;
                oldPriceEl.style.display = "";
            } else {
                oldPriceEl.style.display = "none";
            }
        }

        if (this.data.avis) {
            setText("ratingValue", this.data.avis.note);
            setText("reviewCount", `(${this.data.avis.nombre} avis)`);
        }

        document.title = `${this.data.nom} | Libasse`;

        this.renderFeatures();
        this.renderSizeGuide();
        this.renderSizes();
        this.renderColors();
        this.renderStock();
        this.loadImages();
        this.renderCompleteLook();
        this.renderRelatedProducts();

    }

    /* ======================================================
       Caractéristiques
    ====================================================== */

    renderFeatures() {

        const container = document.getElementById("productFeatures");
        if (!container) return;

        container.innerHTML = "";

        (this.data.caracteristiques || []).forEach(feature => {
            const li = document.createElement("li");
            li.textContent = feature;
            container.appendChild(li);
        });

    }

    /* ======================================================
       Guide des tailles (colonnes variables selon le produit)
    ====================================================== */

    renderSizeGuide() {

        const head = document.getElementById("sizeGuideHead");
        const body = document.getElementById("sizeGuideBody");

        if (!body) return;

        body.innerHTML = "";

        const guide = this.data.guideTailles;

        if (!guide || Object.keys(guide).length === 0) {
            body.innerHTML = `<tr><td colspan="4">Guide des tailles indisponible.</td></tr>`;
            return;
        }

        const labels = {
            poitrine: "Poitrine",
            taille: "Tour de taille",
            longueur: "Longueur",
            tourCou: "Tour de cou"
        };

        // Les mesures disponibles diffèrent d'un produit à l'autre
        // (un trench a une longueur, une chemise un tour de cou, etc.)
        const firstSize = Object.values(guide)[0];
        const measureKeys = Object.keys(firstSize);

        if (head) {
            head.innerHTML = "<th>Taille</th>" +
                measureKeys.map(key => `<th>${labels[key] || key}</th>`).join("");
        }

        Object.entries(guide).forEach(([sizeLabel, measures]) => {
            const row = document.createElement("tr");
            const cells = [sizeLabel, ...measureKeys.map(key => `${measures[key]} cm`)];
            row.innerHTML = cells.map(cell => `<td>${cell}</td>`).join("");
            body.appendChild(row);
        });

    }

    /* ======================================================
       Tailles
    ====================================================== */

    renderSizes() {

        const container = document.getElementById("sizes");
        if (!container) return;

        container.innerHTML = "";

        if (!this.data.tailles) return;

        this.data.tailles.forEach(size => {

            const button = document.createElement("button");
            button.type = "button";
            button.className = "btn btn-outline-dark";
            button.textContent = size;
            button.dataset.size = size;

            if (size === this.currentSize) {
                button.classList.add("active");
            }

            container.appendChild(button);

        });

    }

    installSizeEvents() {

        const container = document.getElementById("sizes");
        if (!container) return;

        container.addEventListener("click", event => {

            const button = event.target.closest("button[data-size]");
            if (!button) return;

            this.currentSize = button.dataset.size;

            container.querySelectorAll("button").forEach(b =>
                b.classList.remove("active")
            );
            button.classList.add("active");

        });

    }

    /* ======================================================
       Couleurs
    ====================================================== */

    renderColors() {

        const container = document.getElementById("colors");
        if (!container) return;

        container.innerHTML = "";

        this.data.variantes.forEach(variante => {

            const swatch = document.createElement("div");
            swatch.className = "swatch";
            swatch.dataset.variant = variante.slug;
            swatch.title = variante.nom;
            swatch.style.background = variante.codeCouleur;

            if (variante.slug === this.currentColor.slug) {
                swatch.classList.add("active");
            }

            container.appendChild(swatch);

        });

        const selectedColorEl = document.getElementById("selectedColor");
        if (selectedColorEl) selectedColorEl.textContent = this.currentColor.nom;

    }

    /* ======================================================
       Disponibilité (dépend de la couleur choisie)
    ====================================================== */

    renderStock() {

        const inStock = (this.currentColor.stock ?? 0) > 0;
        const label = inStock ? "En stock" : "Rupture de stock";

        ["stockText", "purchaseStock"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = label;
        });

        const addToCart = document.getElementById("addToCart");
        const buyNow = document.getElementById("buyNow");
        [addToCart, buyNow].forEach(button => {
            if (button) button.disabled = !inStock;
        });

    }

    /* ======================================================
       Construction des chemins d'images
    ====================================================== */

    buildImages() {

        if (!this.data.imageBase) {
            console.error("imageBase manquant pour le produit :", this.data.slug);
            return [];
        }

        if (!this.currentColor.dossier) {
            console.error("dossier manquant pour la variante :", this.currentColor.slug);
            return [];
        }

        const base = `${this.data.imageBase}/${this.currentColor.dossier}`;

        return [
            `${base}/principale.jpg`,
            `${base}/dos.jpg`,
            `${base}/profil.jpg`,
            `${base}/detail.jpg`
        ];

    }

    /* ======================================================
       Chargement des images
    ====================================================== */

    loadImages() {

        const images = this.buildImages();
        if (images.length === 0) return;

        const thumbs = document.querySelectorAll(".thumb");
        thumbs.forEach((thumb, index) => {
            if (images[index]) thumb.src = images[index];
        });

        const mainImage = document.getElementById("mainProductImage");
        if (!mainImage) return;

        if (mainImage.src !== images[0]) {
            mainImage.classList.add("fade-out");
            setTimeout(() => {
                mainImage.src = images[0];
                mainImage.classList.remove("fade-out");
            }, 300);
        } else {
            mainImage.src = images[0];
        }

        thumbs.forEach(t => t.classList.remove("active"));
        if (thumbs.length) thumbs[0].classList.add("active");

    }

    /* ======================================================
       Gestion des couleurs
    ====================================================== */

    installColorEvents() {

        const container = document.getElementById("colors");
        if (!container) return;

        container.addEventListener("click", event => {

            const swatch = event.target.closest(".swatch");
            if (!swatch) return;

            const slug = swatch.dataset.variant;
            const variante = this.data.variantes.find(v => v.slug === slug);
            if (!variante) return;

            this.currentColor = variante;
            this.renderColors();
            this.renderStock();
            this.loadImages();

        });

    }

    /* ======================================================
       Gestion des miniatures
    ====================================================== */

    installThumbnailEvents() {

        const thumbs = document.querySelectorAll(".thumb");
        const mainImage = document.getElementById("mainProductImage");
        if (!mainImage) return;

        thumbs.forEach(thumb => {

            thumb.addEventListener("click", () => {

                thumbs.forEach(t => t.classList.remove("active"));
                thumb.classList.add("active");

                if (thumb.src) {
                    mainImage.classList.add("fade-out");
                    setTimeout(() => {
                        mainImage.src = thumb.src;
                        mainImage.classList.remove("fade-out");
                    }, 200);
                }

            });

        });

    }

    /* ======================================================
       Quantité
    ====================================================== */

    installQuantityEvents() {

        const input = document.getElementById("quantity");
        const minus = document.getElementById("qtyMinus");
        const plus = document.getElementById("qtyPlus");

        if (!input) return;

        const clamp = () => {
            let value = parseInt(input.value, 10);
            if (isNaN(value) || value < 1) value = 1;
            input.value = value;
            return value;
        };

        clamp();

        if (minus) {
            minus.addEventListener("click", () => {
                input.value = clamp() - 1;
                clamp();
            });
        }

        if (plus) {
            plus.addEventListener("click", () => {
                input.value = clamp() + 1;
            });
        }

        input.addEventListener("change", clamp);

    }

    /* ======================================================
       "Complétez votre tenue"
    ====================================================== */

    renderCompleteLook() {

        const container = document.getElementById("completeLookGrid");
        if (!container) return;

        container.innerHTML = "";

        const slugs = this.data.completeLook || [];
        const produits = this.catalogue.catalogue.produits;

        slugs.forEach(slug => {

            const produit = produits.find(p => p.slug === slug);
            if (!produit) return;

            container.appendChild(this.buildProductCard(produit, "look-item"));

        });

    }

    /* ======================================================
       "Vous aimerez aussi"
    ====================================================== */

    renderRelatedProducts() {

        const container = document.getElementById("relatedGrid");
        if (!container) return;

        container.innerHTML = "";

        const slugs = this.data.produitsSimilaires || [];
        const produits = this.catalogue.catalogue.produits;

        slugs.forEach(slug => {

            const produit = produits.find(p => p.slug === slug);
            if (!produit) return;

            container.appendChild(this.buildProductCard(produit, "product-card"));

        });

    }

    /* ======================================================
       Carte produit réutilisable (couleur + tuiles similaires)
    ====================================================== */

    buildProductCard(produit, className) {

        const variante = produit.variantes[0];
        const image = variante && produit.imageBase && variante.dossier
            ? `${produit.imageBase}/${variante.dossier}/principale.jpg`
            : "";

        const link = document.createElement("a");
        link.href = `index.html?id=${encodeURIComponent(produit.slug)}`;
        link.className = "product-link";

        const article = document.createElement("article");
        article.className = className;

        article.innerHTML = `
            <img src="${image}" alt="${produit.nom}">
            <h3>${produit.nom}</h3>
            <p>${produit.prix.actuel} ${produit.prix.devise}</p>
            ${className === "look-item" ? '<button class="btn btn-outline" type="button">Voir le produit</button>' : ""}
        `;

        link.appendChild(article);
        return link;

    }

    /* ======================================================
       Panier (stockage local simple, sans backend)
    ====================================================== */

    getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    saveCart(cart) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }

    updateCartBadge() {
        const badge = document.getElementById("cartCount");
        if (!badge) return;
        const cart = this.getCart();
        const total = cart.reduce((sum, item) => sum + item.quantite, 0);
        badge.textContent = total;
    }

    addToCart() {

        const quantityInput = document.getElementById("quantity");
        const quantite = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;

        if (this.data.tailles && this.data.tailles.length && !this.currentSize) {
            alert("Merci de choisir une taille avant d'ajouter au panier.");
            return false;
        }

        const cart = this.getCart();

        const item = {
            produitId: this.data.slug,
            nom: this.data.nom,
            couleur: this.currentColor.nom,
            taille: this.currentSize,
            quantite,
            prixUnitaire: this.data.prix.actuel,
            devise: this.data.prix.devise
        };

        const existing = cart.find(i =>
            i.produitId === item.produitId &&
            i.couleur === item.couleur &&
            i.taille === item.taille
        );

        if (existing) {
            existing.quantite += quantite;
        } else {
            cart.push(item);
        }

        this.saveCart(cart);
        this.updateCartBadge();

        return true;

    }

    installPurchaseEvents() {

        const addToCart = document.getElementById("addToCart");
        const buyNow = document.getElementById("buyNow");

        if (addToCart) {
            addToCart.addEventListener("click", () => {

                const added = this.addToCart();
                if (!added) return;

                const originalLabel = addToCart.innerHTML;
                addToCart.innerHTML = '<i class="bi bi-check2"></i> Ajouté au panier';

                setTimeout(() => {
                    addToCart.innerHTML = originalLabel;
                }, 1500);

            });
        }

        if (buyNow) {
            buyNow.addEventListener("click", () => {
                const added = this.addToCart();
                if (!added) return;
                alert("Cette boutique de démonstration n'a pas encore de tunnel de paiement — votre article a été ajouté au panier.");
            });
        }

    }

    /* ======================================================
       Zoom
    ====================================================== */

    installZoom() {
        if (window.productZoom) {
            window.productZoom.reset();
        }
    }

}

/* ==========================================================
   INITIALISATION
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) {
        console.error("Aucun identifiant de produit dans l'URL.");
        const title = document.getElementById("productTitle");
        if (title) title.textContent = "Aucun produit sélectionné";
        const shortDesc = document.getElementById("productShortDescription");
        if (shortDesc) {
            shortDesc.textContent =
                "Ajoutez un paramètre ?id=trench-premium (ou un autre identifiant de produit) à l'URL pour afficher une fiche produit.";
        }
        return;
    }

    const product = new Product(productId);
    product.load();

});
