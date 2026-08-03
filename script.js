document.addEventListener("DOMContentLoaded", () => {

    const mainImage = document.getElementById("mainProductImage");
    const thumbnails = document.querySelectorAll(".thumb");

    thumbnails.forEach((thumb) => {

        thumb.addEventListener("click", () => {

            // Retirer la sélection précédente
            thumbnails.forEach(t => t.classList.remove("active"));

            // Sélectionner la miniature cliquée
            thumb.classList.add("active");

            // Changer l'image principale
            mainImage.src = thumb.src;

        });

    });

});