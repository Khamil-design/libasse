/* ==========================================================
   LIBASSE
   PRODUCT ENGINE
========================================================== */

class Product {

    constructor(productId) {

        this.productId = productId;
        this.data = null;
        this.currentColor = null;

    }

    /* ======================================================
       Chargement du catalogue
    ====================================================== */

    async load() {

        try {

            const response = await fetch("data/catalogue.json");

            const catalogue = await response.json();

            this.data = catalogue.produits.find(
                p => p.id === this.productId
            );

            if (!this.data) {

                throw new Error("Produit introuvable.");

            }

            this.currentColor = this.data.couleurs[0];

            this.render();

            this.installColorEvents();

            this.installThumbnailEvents();

        }

        catch (error) {

            console.error(error);

        }

    }

    /* ======================================================
       Affichage
    ====================================================== */

    render() {

        document.getElementById("productTitle").textContent =
            this.data.nom;

        document.getElementById("productPrice").textContent =
            this.data.prix + " DH";

        document.getElementById("productDescription").textContent =
            this.data.descriptionLongue;

        this.renderSizes();

        this.renderColors();

        this.loadImages();

    }

    /* ======================================================
       Tailles
    ====================================================== */

    renderSizes() {

        const container =
            document.getElementById("sizes");

        container.innerHTML = "";

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

        const container =
            document.getElementById("colors");

        container.innerHTML = "";

        this.data.couleurs.forEach(color => {

            const swatch =
                document.createElement("div");

            swatch.className = "swatch";

            swatch.dataset.color = color.id;

            swatch.title = color.nom;

            swatch.style.background =
                color.code;

            if (color.id === this.currentColor.id) {

                swatch.classList.add("active");

            }

            container.appendChild(swatch);

        });

    }

    /* ======================================================
       Images
    ====================================================== */

    loadImages() {

        const images = [

            this.currentColor.images.principale,
            this.currentColor.images.dos,
            this.currentColor.images.profil,
            this.currentColor.images.detail

        ];

        const thumbs =
            document.querySelectorAll(".thumb");

        thumbs.forEach((thumb, index) => {

            thumb.src = images[index];

        });

        document.getElementById(
            "mainProductImage"
        ).src = images[0];

    }

    /* ======================================================
       Changement couleur
    ====================================================== */

    installColorEvents() {

        document.addEventListener("click", e => {

            if (!e.target.classList.contains("swatch"))
                return;

            const colorId =
                e.target.dataset.color;

            this.currentColor =
                this.data.couleurs.find(

                    c => c.id === colorId

                );

            document
                .querySelectorAll(".swatch")
                .forEach(s =>

                    s.classList.remove("active")

                );

            e.target.classList.add("active");

            this.loadImages();

        });

    }

    /* ======================================================
       Miniatures
    ====================================================== */

    installThumbnailEvents() {

        const main =
            document.getElementById(
                "mainProductImage"
            );

        document
            .querySelectorAll(".thumb")
            .forEach(thumb => {

                thumb.onclick = () => {

                    document
                        .querySelectorAll(".thumb")
                        .forEach(t =>

                            t.classList.remove(
                                "active"
                            )

                        );

                    thumb.classList.add("active");

                    main.src = thumb.src;

                };

            });

    }

}

/* ==========================================================
   Démarrage
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);

    const productId =
        params.get("id") || "trench-premium";

    const product = new Product(productId);

    product.load();

});
