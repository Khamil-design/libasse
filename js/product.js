/* ==========================================================
   LIBASSE
   PRODUCT ENGINE
========================================================== */

class Product {

    constructor(productId) {
        this.productId = productId;
        this.data = null;
        this.currentColor = null;
        this.colorClickListener = null;
        this._zoomHandlers = null;
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

            console.log(catalogue);
            console.log("ProductId recherché :", this.productId);
            console.log("Slugs disponibles :", catalogue.catalogue?.produits?.map(p => p.slug) || []);

            this.data = catalogue.catalogue.produits.find(
                p => p.slug === this.productId
            );

            if (!this.data) {
                throw new Error("Produit introuvable.");
            }
            if (!this.data.variantes || this.data.variantes.length === 0) {
                throw new Error("Aucune variante disponible.");
            }

            this.currentColor = this.data.variantes[0];

            this.render();
            this.installColorEvents();
            this.installThumbnailEvents();
            this.installZoom(); // Zoom premium

        } catch (error) {
            console.error("Erreur lors du chargement :", error);
        }
    }

    /* ======================================================
       Affichage
    ====================================================== */

    render() {
        const titleEl = document.getElementById("productTitle");
        if (titleEl) titleEl.textContent = this.data.nom;

        const priceEl = document.getElementById("productPrice");
        if (priceEl) priceEl.textContent = this.data.prix.actuel + " " + this.data.prix.devise;

        const descEl = document.getElementById("productDescription");
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
            console.warn("Aucune image disponible pour cette variante.");
            return;
        }

        const images = [
            this.currentColor.images.principale,
            this.currentColor.images.dos,
            this.currentColor.images.profil,
            this.currentColor.images.detail
        ].filter(src => src);

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

        // Réinitialiser l'active sur la première miniature
        if (thumbs.length) {
            thumbs.forEach(t => t.classList.remove("active"));
            thumbs[0].classList.add("active");
        }
    }

    /* ======================================================
       Changement couleur
    ====================================================== */

    installColorEvents() {
        if (this.colorClickListener) {
            document.removeEventListener("click", this.colorClickListener);
        }

        this.colorClickListener = (e) => {
            const swatch = e.target.closest(".swatch");
            if (!swatch) return;

            const variantSlug = swatch.dataset.variant;
            const newColor = this.data.variantes.find(v => v.slug === variantSlug);
            if (!newColor) return;

            this.currentColor = newColor;

            document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
            swatch.classList.add("active");

            this.loadImages();
        };

        document.addEventListener("click", this.colorClickListener);
    }

    /* ======================================================
       Miniatures
    ====================================================== */

    installThumbnailEvents() {
        const mainImg = document.getElementById("mainProductImage");
        if (!mainImg) return;

        const thumbs = document.querySelectorAll(".thumb");
        thumbs.forEach(thumb => {
            thumb.removeEventListener("click", thumb._handler);
            thumb._handler = () => {
                thumbs.forEach(t => t.classList.remove("active"));
                thumb.classList.add("active");
                mainImg.src = thumb.src;
            };
            thumb.addEventListener("click", thumb._handler);
        });
    }

    /* ======================================================
       Zoom Premium (suivi du curseur)
    ====================================================== */

    installZoom() {
        const container = document.querySelector('.main-image');
        const img = document.getElementById('mainProductImage');

        if (!container || !img) return;

        // Supprimer les anciens écouteurs pour éviter les doublons
        if (this._zoomHandlers) {
            container.removeEventListener('mousemove', this._zoomHandlers.move);
            container.removeEventListener('mouseleave', this._zoomHandlers.leave);
        }

        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            img.style.transformOrigin = `${x}% ${y}%`;
            img.style.transform = 'scale(2.4)';
            img.style.transition = 'transform 0.25s ease-out';
        };

        const handleMouseLeave = () => {
            img.style.transform = 'scale(1)';
            img.style.transformOrigin = 'center center';
            img.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);

        this._zoomHandlers = {
            move: handleMouseMove,
            leave: handleMouseLeave
        };
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
