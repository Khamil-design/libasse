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
           console.log(catalogue);
         console.log("ProductId recherché :", this.productId);
         console.log("Slugs disponibles :", catalogue.catalogue.produits.map(p => p.slug));
            this.data = catalogue.catalogue.produits.find(
             p => p.slug === this.productId
      );

            if (!this.data) {

                throw new Error("Produit introuvable.");

            }

            this.currentColor = this.data.variantes[0];

            this.render();

            this.installColorEvents();

            this.installThumbnailEvents();

        }

        catch (error) {

            console.error(error);

        }
        this.render();
        this.installColorEvents();
        this.installThumbnailEvents();
        this.installZoom(); // <--- AJOUTE CETTE LIGNE

    } catch (error) {
        console.error(error);
    }
    
/* ======================================================
       Affichage
    ====================================================== */

    render() {

        document.getElementById("productTitle").textContent =
            this.data.nom;

      document.getElementById("productPrice").textContent =
          this.data.prix.actuel + " " +
          this.data.prix.devise;

       document.getElementById("productDescription").textContent =
          this.data.description.longue;

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

        this.data.variantes.forEach(color => {

            const swatch =
                document.createElement("div");

            swatch.className = "swatch";

            swatch.dataset.variant = color.slug;

            swatch.title = color.nom;

           swatch.style.background =
             color.codeCouleur;

            if (color.slug === this.currentColor.slug){

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

        const mainImage = document.getElementById("mainProductImage");

	if (window.productZoom) {
    	window.productZoom.reset();
}

mainImage.src = images[0];

    }

    /* ======================================================
       Changement couleur
    ====================================================== */

    installColorEvents() {

        document.addEventListener("click", e => {

            if (!e.target.classList.contains("swatch"))
                return;

            const variantSlug =
             e.target.dataset.variant;

            this.currentColor =
             this.data.variantes.find(

              v => v.slug === variantSlug

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

                    if (window.productZoom) {
    			window.productZoom.reset();
		}

			main.src = thumb.src;

                };

            });

    }

}
/* ======================================================
   ZOOM DYNAMIQUE (suivi du curseur)
====================================================== */

installZoom() {
    const container = document.querySelector('.main-image');
    const img = document.getElementById('mainProductImage');

    if (!container || !img) return;

    // On retire les anciens écouteurs pour éviter les doublons
    if (this._zoomHandlers) {
        container.removeEventListener('mousemove', this._zoomHandlers.move);
        container.removeEventListener('mouseleave', this._zoomHandlers.leave);
    }

    const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();

        // Calcul du pourcentage de la position de la souris dans l'image
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // On place l'origine du zoom à l'endroit du curseur
        img.style.transformOrigin = `${x}% ${y}%`;
        img.style.transform = 'scale(2.4)'; // Ajuste la puissance du zoom ici (2.4 = 240%)
        img.style.transition = 'transform 0.25s ease-out';
    };

    const handleMouseLeave = () => {
        // Retour au calme en douceur
        img.style.transform = 'scale(1)';
        img.style.transformOrigin = 'center center';
        img.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // On garde une référence pour pouvoir nettoyer plus tard
    this._zoomHandlers = {
        move: handleMouseMove,
        leave: handleMouseLeave
    };
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
