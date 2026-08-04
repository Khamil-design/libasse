/* ==========================================================
   LIBASSE
   IMAGE ZOOM
========================================================== */

class ProductZoom {

    constructor(imageId) {

        this.image = document.getElementById(imageId);

        if (!this.image) return;

        this.scale = 2;

        this.init();

    }

    init() {

        this.image.addEventListener(
            "mouseenter",
            this.enter.bind(this)
        );

        this.image.addEventListener(
            "mousemove",
            this.move.bind(this)
        );

        this.image.addEventListener(
            "mouseleave",
            this.leave.bind(this)
        );

    }

    enter() {

        this.image.style.cursor = "move";

    }

    move(event) {

        const rect = this.image.getBoundingClientRect();

        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        this.image.style.transformOrigin = `${x}% ${y}%`;
        this.image.style.transform = `scale(${this.scale})`;

    }

    leave() {

        this.image.style.transform = "scale(1)";
        this.image.style.transformOrigin = "center center";
        this.image.style.cursor = "zoom-in";

    }
reset() {

    this.image.style.transform = "scale(1)";
    this.image.style.transformOrigin = "center center";
    this.image.style.cursor = "zoom-in";

}
}

/* ==========================================================
   INITIALISATION
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    window.productZoom = new ProductZoom("mainProductImage");

});

});