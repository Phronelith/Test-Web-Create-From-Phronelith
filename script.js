/* ===== BAKSO PAK KUMIS — interaksi ===== */
(function () {
  "use strict";

  var WA_NUMBER = "6281234567890"; // ganti dengan nomor WhatsApp toko

  var cart = [];

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var rupiah = function (n) {
    return "Rp " + n.toLocaleString("id-ID");
  };

  /* ---------- Header: bayangan saat scroll ---------- */
  var header = $("#header");
  var onScroll = function () {
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var nav = $("#nav");
  var navToggle = $("#navToggle");
  navToggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  });
  $$("#nav a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Toast ---------- */
  var toast = $("#toast");
  var toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }

  /* ---------- Keranjang ---------- */
  var cartList = $("#cartList");
  var cartEmpty = $("#cartEmpty");
  var cartTotal = $("#cartTotal");
  var submitBtn = $("#submitBtn");
  var formNote = $("#formNote");

  function findItem(name) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].name === name) return cart[i];
    }
    return null;
  }

  function totalQty() {
    return cart.reduce(function (sum, it) { return sum + it.qty; }, 0);
  }

  function totalPrice() {
    return cart.reduce(function (sum, it) { return sum + it.qty * it.price; }, 0);
  }

  function addToCart(name, price) {
    var item = findItem(name);
    if (item) {
      item.qty += 1;
    } else {
      cart.push({ name: name, price: price, qty: 1 });
    }
    renderCart();
    showToast(name + " ditambahkan");
  }

  function changeQty(name, delta) {
    var item = findItem(name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(function (it) { return it.name !== name; });
    }
    renderCart();
  }

  function renderCart() {
    cartList.innerHTML = "";

    if (cart.length === 0) {
      cartList.appendChild(cartEmpty);
      cartEmpty.style.display = "";
    } else {
      cartEmpty.style.display = "none";
      cart.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "cart-item";

        var nameSpan = document.createElement("span");
        nameSpan.className = "ci-name";
        nameSpan.textContent = item.name;

        var qtyCtrl = document.createElement("span");
        qtyCtrl.className = "qty-ctrl";

        var minus = document.createElement("button");
        minus.type = "button";
        minus.textContent = "−";
        minus.setAttribute("aria-label", "Kurangi " + item.name);
        minus.addEventListener("click", function () { changeQty(item.name, -1); });

        var qty = document.createElement("span");
        qty.textContent = String(item.qty);

        var plus = document.createElement("button");
        plus.type = "button";
        plus.textContent = "+";
        plus.setAttribute("aria-label", "Tambah " + item.name);
        plus.addEventListener("click", function () { changeQty(item.name, 1); });

        qtyCtrl.appendChild(minus);
        qtyCtrl.appendChild(qty);
        qtyCtrl.appendChild(plus);

        var priceSpan = document.createElement("span");
        priceSpan.className = "ci-price";
        priceSpan.textContent = rupiah(item.price * item.qty);

        li.appendChild(nameSpan);
        li.appendChild(qtyCtrl);
        li.appendChild(priceSpan);
        cartList.appendChild(li);
      });
    }

    cartTotal.textContent = rupiah(totalPrice());

    var hasItems = cart.length > 0;
    submitBtn.disabled = !hasItems;
    formNote.textContent = hasItems
      ? "Total " + totalQty() + " porsi. Isi nama & alamat lalu kirim."
      : "Tambahkan minimal 1 menu untuk memesan.";
  }

  /* Tombol tambah di kartu menu */
  $$("[data-add]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".menu-card");
      if (!card) return;
      addToCart(card.dataset.name, parseInt(card.dataset.price, 10));
    });
  });

  /* ---------- Form pesanan ---------- */
  var form = $("#orderForm");
  var nama = $("#nama");
  var alamat = $("#alamat");
  var catatan = $("#catatan");

  function markInvalid(el, invalid) {
    el.classList.toggle("invalid", invalid);
  }

  [nama, alamat].forEach(function (el) {
    el.addEventListener("input", function () {
      if (el.value.trim()) markInvalid(el, false);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (cart.length === 0) {
      showToast("Keranjang masih kosong");
      return;
    }

    var namaVal = nama.value.trim();
    var alamatVal = alamat.value.trim();
    markInvalid(nama, !namaVal);
    markInvalid(alamat, !alamatVal);

    if (!namaVal) { nama.focus(); showToast("Nama belum diisi"); return; }
    if (!alamatVal) { alamat.focus(); showToast("Alamat belum diisi"); return; }

    var lines = [];
    lines.push("Halo Bakso Pak Kumis, saya mau pesan:");
    lines.push("");
    cart.forEach(function (it) {
      lines.push("• " + it.name + " x" + it.qty + " — " + rupiah(it.price * it.qty));
    });
    lines.push("");
    lines.push("Total: " + rupiah(totalPrice()));
    lines.push("");
    lines.push("Nama: " + namaVal);
    lines.push("Alamat: " + alamatVal);
    var catatanVal = catatan.value.trim();
    if (catatanVal) lines.push("Catatan: " + catatanVal);

    var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener");
    showToast("Membuka WhatsApp...");
  });

  /* ---------- Tahun footer ---------- */
  $("#year").textContent = String(new Date().getFullYear());

  /* ---------- Init ---------- */
  renderCart();
})();
