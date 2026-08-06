/* ==========================================================
   LIBASSE
   PAGE PANIER
========================================================== */

function formatPrice(amount, devise) {
    return `${amount} ${devise}`;
}

function cartItemKey(item) {
    return `${item.produitId}|${item.couleur}|${item.taille}`;
}

function renderEmptyCart(container) {

    container.innerHTML = `
        <div class="empty-state">
            <i class="bi bi-bag"></i>
            <h3>Votre panier est vide</h3>
            <span>Parcourez nos collections pour trouver votre prochaine pièce préférée.</span>
            <div class="cart-empty-actions">
                <a href="index.html" class="btn btn-primary">Continuer mes achats</a>
            </div>
        </div>
    `;

}

function buildCartItemRow(item) {

    const row = document.createElement("div");
    row.className = "cart-item";
    row.dataset.key = cartItemKey(item);

    const meta = [];
    if (item.couleur) meta.push(`Couleur : ${item.couleur}`);
    if (item.taille) meta.push(`Taille : ${item.taille}`);

    const lineTotal = item.prixUnitaire * item.quantite;

    row.innerHTML = `
        <img src="${item.image || ''}" alt="${item.nom}">
        <div class="cart-item-info">
            <h3><a href="produit.html?id=${encodeURIComponent(item.produitId)}">${item.nom}</a></h3>
            <p class="cart-item-meta">${meta.join(" · ")}</p>
            <p class="cart-item-price">${formatPrice(item.prixUnitaire, item.devise)} / pièce</p>
        </div>
        <div class="cart-item-actions">
            <p class="cart-item-price">${formatPrice(lineTotal, item.devise)}</p>
            <div class="quantity-selector">
                <button type="button" class="qty-minus" aria-label="Diminuer la quantité">−</button>
                <input type="text" value="${item.quantite}" readonly>
                <button type="button" class="qty-plus" aria-label="Augmenter la quantité">+</button>
            </div>
            <button type="button" class="cart-remove">
                <i class="bi bi-trash3"></i> Retirer
            </button>
        </div>
    `;

    return row;

}

function renderSummary(cart) {

    const subtotal = cartSubtotal(cart);
    const devise = cart[0]?.devise || "DH";

    const summary = document.createElement("div");
    summary.className = "cart-summary";

    summary.innerHTML = `
        <h2>Récapitulatif</h2>
        <div class="cart-summary-row">
            <span>Sous-total</span>
            <span>${formatPrice(subtotal, devise)}</span>
        </div>
        <div class="cart-summary-row">
            <span>Livraison</span>
            <span>Calculée à l'étape suivante</span>
        </div>
        <div class="cart-summary-row total">
            <span>Total</span>
            <span>${formatPrice(subtotal, devise)}</span>
        </div>
        <button type="button" id="checkoutButton" class="btn btn-primary">
            Passer la commande
        </button>
        <p class="cart-summary-note">
            Cette boutique de démonstration n'a pas encore de tunnel de paiement.
        </p>
    `;

    return summary;

}

function renderCart() {

    const container = document.getElementById("cartContent");
    const countLabel = document.getElementById("cartCountLabel");
    if (!container) return;

    const cart = getCart();

    if (countLabel) {
        const count = cartItemCount(cart);
        countLabel.textContent = count > 1 ? `${count} articles` : `${count} article`;
    }

    if (cart.length === 0) {
        renderEmptyCart(container);
        updateCartBadge();
        return;
    }

    container.innerHTML = "";

    const layout = document.createElement("div");
    layout.className = "cart-layout";

    const itemsList = document.createElement("div");
    itemsList.className = "cart-items";
    cart.forEach(item => itemsList.appendChild(buildCartItemRow(item)));

    layout.appendChild(itemsList);
    layout.appendChild(renderSummary(cart));
    container.appendChild(layout);

    updateCartBadge();

    const checkoutButton = document.getElementById("checkoutButton");
    if (checkoutButton) {
        checkoutButton.addEventListener("click", () => {
            alert("Cette boutique de démonstration n'a pas encore de tunnel de paiement. Votre panier reste enregistré pour plus tard.");
        });
    }

}

function changeQuantity(key, delta) {

    const cart = getCart();
    const item = cart.find(i => cartItemKey(i) === key);
    if (!item) return;

    item.quantite = Math.max(1, item.quantite + delta);

    saveCart(cart);
    renderCart();

}

function removeItem(key) {

    let cart = getCart();
    cart = cart.filter(i => cartItemKey(i) !== key);

    saveCart(cart);
    renderCart();

}

function initCartPage() {

    updateCartBadge();
    renderCart();

    const container = document.getElementById("cartContent");
    if (!container) return;

    container.addEventListener("click", event => {

        const row = event.target.closest(".cart-item");
        if (!row) return;

        const key = row.dataset.key;

        if (event.target.closest(".qty-plus")) {
            changeQuantity(key, 1);
        }

        else if (event.target.closest(".qty-minus")) {
            changeQuantity(key, -1);
        }

        else if (event.target.closest(".cart-remove")) {
            removeItem(key);
        }

    });

}

document.addEventListener("DOMContentLoaded", initCartPage);
