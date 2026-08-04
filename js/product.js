/* ==========================================================
   LIBASSE
   PRODUCT ENGINE V2
========================================================== */

class Product {

    constructor(productId) {

        this.productId = productId;

        this.catalogue = null;

        this.data = null;

        this.currentColor = null;

        this.colorClickListener = null;

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

                throw new Error(
                    `Erreur HTTP ${response.status}`
                );

            }

            this.catalogue =
                await response.json();

            this.data =
                this.catalogue.catalogue.produits.find(

                    produit =>
                        produit.slug === this.productId

                );

            if (!this.data) {

                throw new Error(
                    `Produit "${this.productId}" introuvable.`
                );

            }

            if (!this.data.variantes ||
                this.data.variantes.length === 0) {

                throw new Error(
                    "Aucune variante disponible."
                );

            }

            this.currentColor =
                this.data.variantes[0];

            this.render();

            this.installColorEvents();

            this.installThumbnailEvents();

            this.installZoom();

        }

        catch (error) {

            console.error(error);

        }

    }

    /* ======================================================
       Affichage
    ====================================================== */

    render() {

        const title =
            document.getElementById("productTitle");

        if (title) {

            title.textContent =
                this.data.nom;

        }

        const price =
            document.getElementById("productPrice");

        if (price) {

            price.textContent =
                `${this.data.prix.actuel} ${this.data.prix.devise}`;

        }

        const description =
            document.getElementById("productDescription");

        if (description) {

            description.textContent =
                this.data.description.longue;

        }

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

        if (!this.data.tailles) return;

        this.data.tailles.forEach(size => {

            const button = document.createElement("button");

            button.className = "btn btn-outline-dark";

            button.textContent = size;

            container.appendChild(button);

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

    }

    /* ======================================================
       Construction des chemins d'images
    ====================================================== */

    buildImages() {

        if (!this.data.imageBase) {

            console.error(
                "imageBase manquant pour le produit :",
                this.data.slug
            );

            return [];

        }

        if (!this.currentColor.dossier) {

            console.error(
                "dossier manquant pour la variante :",
                this.currentColor.slug
            );

            return [];

        }

        const base =
            `${this.data.imageBase}/${this.currentColor.dossier}`;

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

        const thumbs =
            document.querySelectorAll(".thumb");

        thumbs.forEach((thumb, index) => {

            if (images[index]) {

                thumb.src = images[index];

            }

        });

        const mainImage =
            document.getElementById("mainProductImage");

        if (!mainImage) return;

        if (mainImage.src !== images[0]) {

            mainImage.classList.add("fade-out");

            setTimeout(() => {

                mainImage.src = images[0];

                mainImage.classList.remove("fade-out");

            }, 300);

        }

        else {

            mainImage.src = images[0];

        }

        thumbs.forEach(t =>
            t.classList.remove("active")
        );

        if (thumbs.length) {

            thumbs[0].classList.add("active");

        }

    }
    /* ======================================================
       Gestion des couleurs
    ====================================================== */

    installColorEvents() {

        const swatches =
            document.querySelectorAll(".swatch");

        swatches.forEach(swatch => {

            swatch.addEventListener("click", () => {

                const slug =
                    swatch.dataset.variant;

                const variante =
                    this.data.variantes.find(

                        v => v.slug === slug

                    );

                if (!variante) return;

                this.currentColor = variante;

                this.renderColors();

                this.loadImages();

            });

        });

    }

    /* ======================================================
       Gestion des miniatures
    ====================================================== */

    installThumbnailEvents() {

        const thumbs =
            document.querySelectorAll(".thumb");

        const mainImage =
            document.getElementById("mainProductImage");

        if (!mainImage) return;

        thumbs.forEach(thumb => {

            thumb.addEventListener("click", () => {

                thumbs.forEach(t =>
                    t.classList.remove("active")
                );

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

        console.error(
            "Aucun identifiant de produit dans l'URL."
        );

        return;

    }

    const product = new Product(productId);

    product.load();

});