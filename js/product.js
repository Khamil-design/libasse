/* ==========================================================
   LIBASSE
   PRODUCT ENGINE
========================================================== */

class Product {

    constructor(productId) {
        this.productId = productId;
        this.data = null;
        this.currentColor = null;
        // On stocke la référence à l'écouteur pour pouvoir le retirer si besoin
        this.colorClickListener = null;
    }

    /* ======================================================
       Chargement du catalogue
    ====================================================== */

    async load() {
        try {
            const response = await fetch("data/catalogue.json");
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const catalogue = await response.json();

            // Logs de débogage (optionnels)
            console.log(catalogue);
            console.log("ProductId recherché :", this.productId);
            console.log("Slugs disponibles :", catalogue.catalogue?.produits?.map(p => p.slug) || []);

            this.data = catalogue.catalogue.produits.find(
                p => p.slug === this.productId
            );

            if (!this.data) {
                throw new Error("Produit introuvable.");
            }

            // Sécurité : on vérifie qu'il y a au moins une variante
            if (!this.data.variantes || this.data.variantes.length === 0) {
                throw new Error("Aucune variante disponible pour ce produit.");
            }

            this.currentColor = this.data.variantes[0];

            this.render();
            this.installColorEvents();
            this.installThumbnailEvents();

        } catch (error) {
            console.error("Erreur lors du chargement du produit :", error);
            // On peut afficher un message à l'utilisateur ici
        }
    }

    /* ======================================================
       Affichage
    ====================================================== */

    render() {
        // Vérification que les éléments existent dans le DOM
        const titleEl = document.getElementById("productTitle");
        const priceEl = document.getElementById("productPrice");
        const descEl = document.getElementById("productDescription");

        if (titleEl) titleEl.textContent = this.data.nom;
        if (priceEl) priceEl.textContent = this.data.prix.actuel + " " + this.data.prix.devise;
        if (descEl) descEl.textContent = this.data.description.longue;

        this.renderSizes();
        this.renderColors();
        this.loadImages();
    }

    /* ======================================================
       Tailles
    ====================================================== */

    renderSizes() {
        const container = document.getElementById("sizes");
        if (!container) return;
        container.innerHTML = "";

        if (this.data.tailles && this.data.tailles.length) {
            this.data.tailles.forEach(size => {
                const button = document.createElement("button");
                button.className = "btn btn-outline-dark";
                button.textContent = size;
                container.appendChild(button);
            });
        }
    }

    /* ======================================================
       Couleurs
    ====================================================== */

    renderColors() {
        const container = document.getElementById("colors");
        if (!container) return;
        container.innerHTML = "";

        this.data.variantes.forEach(color => {
            const swatch = document.createElement("div");
            swatch.className = "swatch";
            swatch.dataset.variant = color.slug;
            swatch.title = color.nom;
            swatch.style.background = color.codeCouleur;

            if (color.slug === this.currentColor.slug) {
                swatch.classList.add("active");
            }

            container.appendChild(swatch);
        });
    }

    /* ======================================================
       Images
    ====================================================== */

    loadImages() {
        if (!this.currentColor || !this.currentColor.images) {
            console.warn("Aucune image disponible pour la variante courante.");
            return;
        }

        const images = [
            this.currentColor.images.principale,
            this.currentColor.images.dos,
            this.currentColor.images.profil,
            this.currentColor.images.detail
        ].filter(src => src); // On élimine les éventuels undefined

        const thumbs = document.querySelectorAll(".thumb");
        thumbs.forEach((thumb, index) => {
            if (images[index]) {
                thumb.src = images[index];
            }
        });

        const mainImg = document.getElementById("mainProductImage");
        if (mainImg && images[0]) {
            mainImg.src = images[0];
        }

        // Par défaut, on active la première miniature
        if (thumbs.length) {
            thumbs.forEach(t => t.classList.remove("active"));
            thumbs[0].classList.add("active");
        }
    }

    /* ======================================================
       Changement couleur (événements)
    ====================================================== */

    installColorEvents() {
        // On retire l'écouteur précédent pour éviter les doublons
        if (this.colorClickListener) {
            document.removeEventListener("click", this.colorClickListener);
        }

        this.colorClickListener = (e) => {
            // On recherche l'élément .swatch le plus proche du clic
            const swatch = e.target.closest(".swatch");
            if (!swatch) return;

            const variantSlug = swatch.dataset.variant;
            const newColor = this.data.variantes.find(v => v.slug === variantSlug);
            if (!newColor) return;

            // Mise à jour de la couleur courante
            this.currentColor = newColor;

            // Mise à jour des classes actives
            document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
            swatch.classList.add("active");

            // Rechargement des images
            this.loadImages();
        };

        document.addEventListener("click", this.colorClickListener);
    }

    /* ======================================================
       Miniatures (événements)
    ====================================================== */

    installThumbnailEvents() {
        const mainImg = document.getElementById("mainProductImage");
        if (!mainImg) return;

        const thumbs = document.querySelectorAll(".thumb");
        thumbs.forEach(thumb => {
            // On retire d'éventuels écouteurs précédents pour éviter les doublons
            thumb.removeEventListener("click", this._thumbClickHandler);
            // On stocke le handler pour pouvoir le retirer proprement
            thumb._thumbClickHandler = () => {
                thumbs.forEach(t => t.classList.remove("active"));
                thumb.classList.add("active");
                mainImg.src = thumb.src;
            };
            thumb.addEventListener("click", thumb._thumbClickHandler);
        });
    }
}

/* ==========================================================
   Démarrage
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id") || "trench-premium";
    const product = new Product(productId);
    product.load();
});
