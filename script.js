
/* REELVAULT — Spatial Cinema Store
   Functional rentals, purchases, cart, checkout and cinematic GSAP.
   Required: existing REELVAULT index.html.
*/

const $ = id => document.getElementById(id);
const $$ = selector => [...document.querySelectorAll(selector)];
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const hasGSAP = typeof gsap !== "undefined";
const hasScroll = typeof ScrollTrigger !== "undefined";

if (hasGSAP && hasScroll) gsap.registerPlugin(ScrollTrigger);

const peso = value => new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
}).format(value);

function read(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

function save(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {}
}

function canAnimate() {
    return hasGSAP && !motion.matches;
}

const movies = [
    {
        id: "interstellar", title: "Interstellar", genre: "Sci-Fi",
        year: 2014, stock: 5, rent: 85, buy: 390,
        poster: "gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
    },
    {
        id: "inception", title: "Inception", genre: "Sci-Fi",
        year: 2010, stock: 6, rent: 75, buy: 350,
        poster: "oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
    },
    {
        id: "dark-knight", title: "The Dark Knight", genre: "Action",
        year: 2008, stock: 4, rent: 80, buy: 375,
        poster: "qJ2tW6WMUDux911r6m7haRef0WH.jpg"
    },
    {
        id: "oppenheimer", title: "Oppenheimer", genre: "Drama",
        year: 2023, stock: 4, rent: 95, buy: 450,
        poster: "8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"
    },
    {
        id: "endgame", title: "Avengers: Endgame", genre: "Action",
        year: 2019, stock: 6, rent: 90, buy: 425,
        poster: "or06FN3Dka5tukK1e9sl16pB3iy.jpg"
    },
    {
        id: "spiderverse", title: "Into the Spider-Verse",
        genre: "Animation", year: 2018, stock: 5, rent: 80, buy: 360,
        poster: "iiZZdoQBEYBv6id8su7ImL0oCbD.jpg"
    },
    {
        id: "shawshank", title: "The Shawshank Redemption",
        genre: "Drama", year: 1994, stock: 3, rent: 70, buy: 325,
        poster: "9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg"
    },
    {
        id: "wall-e", title: "WALL·E", genre: "Animation",
        year: 2008, stock: 5, rent: 75, buy: 345,
        poster: "hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg"
    }
];

const validItem = item =>
    item &&
    movies.some(movie => movie.id === item.id) &&
    ["rent", "buy"].includes(item.mode) &&
    Number.isInteger(item.qty) &&
    item.qty > 0 &&
    [3, 6, 9].includes(item.days);

let cart = read("rv-cart", []).filter(validItem);
let orders = read("rv-orders", []);
let activeGenre = "All";
let receiptText = "";
let toastTimer;

// ---------- VISUAL EFFECTS ----------

function impact(element) {
    if (!canAnimate()) return;

    gsap.killTweensOf(element);

    gsap.timeline()
        .to(element, {
            scale: 0.78,
            rotation: -5,
            duration: 0.09,
            ease: "power3.in"
        })
        .to(element, {
            scale: 1.16,
            rotation: 4,
            duration: 0.22,
            ease: "back.out(3)"
        })
        .to(element, {
            scale: 1,
            rotation: 0,
            duration: 0.3,
            ease: "elastic.out(1,0.35)"
        });
}

function cartImpact() {
    if (!canAnimate()) return;

    gsap.timeline()
        .to("#cart-open", {
            scale: 1.3,
            rotation: -12,
            duration: 0.16
        })
        .to("#cart-open", {
            scale: 1,
            rotation: 0,
            duration: 0.7,
            ease: "elastic.out(1,0.25)"
        });

    gsap.fromTo("#cart-badge", {
        scale: 2,
        y: -12
    }, {
        scale: 1,
        y: 0,
        duration: 0.65,
        ease: "bounce.out",
        overwrite: true
    });
}

function animateCards() {
    if (!canAnimate()) return;

    gsap.fromTo("#movie-grid article", {
        opacity: 0,
        y: 110,
        scale: 0.68,
        rotationY: -35,
        rotationX: 18,
        filter: "blur(12px)"
    }, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationY: 0,
        rotationX: 0,
        filter: "blur(0px)",
        duration: 1,
        stagger: 0.09,
        ease: "back.out(1.6)",
        overwrite: true,
        clearProps: "transform,filter,opacity"
    });
}

function showToast(message) {
    let toast = $("rv-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "rv-toast";
        toast.setAttribute("role", "status");
        toast.className =
            "fixed bottom-6 left-1/2 z-[100] w-[min(90vw,380px)] " +
            "rounded-2xl border border-white/20 bg-[#211842] px-6 py-4 " +
            "text-center font-bold text-white shadow-2xl";
        document.body.appendChild(toast);
    }

    clearTimeout(toastTimer);
    toast.textContent = message;

    if (canAnimate()) {
        gsap.killTweensOf(toast);
        gsap.fromTo(toast, {
            opacity: 0,
            y: 110,
            xPercent: -50,
            scale: 0.6,
            rotationX: -45
        }, {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            duration: 0.65,
            ease: "back.out(2.2)"
        });
    } else {
        toast.style.transform = "translateX(-50%)";
        toast.style.opacity = "1";
    }

    toastTimer = setTimeout(() => {
        if (canAnimate()) {
            gsap.to(toast, {
                opacity: 0,
                y: 65,
                scale: 0.8,
                duration: 0.35
            });
        } else {
            toast.style.opacity = "0";
        }
    }, 2300);
}

function openDialog(id) {
    const dialog = $(id);
    if (dialog.open) return;

    dialog.showModal();

    if (canAnimate()) {
        gsap.fromTo(dialog, {
            opacity: 0,
            y: 120,
            scale: 0.55,
            rotationX: -28,
            filter: "blur(14px)"
        }, {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            filter: "blur(0px)",
            duration: 0.75,
            ease: "back.out(1.7)",
            clearProps: "transform,filter,opacity"
        });
    }
}

function closeDialog(id) {
    const dialog = $(id);
    if (!dialog.open) return;

    if (!canAnimate()) {
        dialog.close();
        return;
    }

    gsap.to(dialog, {
        opacity: 0,
        y: 60,
        scale: 0.78,
        rotationX: 12,
        duration: 0.25,
        ease: "power3.in",
        onComplete: () => {
            dialog.close();
            gsap.set(dialog, {
                clearProps: "transform,opacity"
            });
        }
    });
}

// ---------- THEME ----------

function updateTheme() {
    const dark = document.documentElement.classList.contains("dark");

    $("theme-toggle").textContent = dark ? "☀ Light" : "☾ Dark";
    $("theme-toggle").setAttribute("aria-pressed", String(dark));
}

if (read("rv-dark", false)) {
    document.documentElement.classList.add("dark");
}

updateTheme();

$("theme-toggle").addEventListener("click", event => {
    document.documentElement.classList.toggle("dark");

    save(
        "rv-dark",
        document.documentElement.classList.contains("dark")
    );

    updateTheme();
    impact(event.currentTarget);
});

// ---------- NAVIGATION ----------

$("nav-toggle").addEventListener("click", () => {
    const menu = $("nav-links");
    const opening = menu.classList.contains("hidden");

    menu.classList.toggle("hidden", !opening);
    menu.classList.toggle("flex", opening);

    $("nav-toggle").setAttribute("aria-expanded", String(opening));

    if (opening && canAnimate()) {
        gsap.fromTo("#nav-links a", {
            opacity: 0,
            x: -55,
            rotationY: -45
        }, {
            opacity: 1,
            x: 0,
            rotationY: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "back.out(2)"
        });
    }
});

$$("#nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        $("nav-links").classList.add("hidden");
        $("nav-links").classList.remove("flex");
        $("nav-toggle").setAttribute("aria-expanded", "false");
    });
});

// ---------- INVENTORY ----------

function available(movie) {
    const purchased = orders.reduce((sum, order) => {
        return sum + order.items
            .filter(item => item.id === movie.id && item.mode === "buy")
            .reduce((count, item) => count + item.qty, 0);
    }, 0);

    return Math.max(0, movie.stock - purchased);
}

function reservedCopies(id) {
    return cart
        .filter(item => item.id === id)
        .reduce((sum, item) => sum + item.qty, 0);
}

// ---------- CATALOG ----------

function renderMovies() {
    const search = $("search").value.trim().toLowerCase();

    const filtered = movies.filter(movie => {
        const matchesGenre =
            activeGenre === "All" || movie.genre === activeGenre;

        const matchesSearch =
            `${movie.title} ${movie.genre} ${movie.year}`
                .toLowerCase()
                .includes(search);

        return matchesGenre && matchesSearch;
    });

    const grid = $("movie-grid");
    grid.replaceChildren();

    filtered.forEach(movie => {
        const card = document.createElement("article");
        card.className =
            "spatial-card overflow-hidden !p-3 group";

        const poster = document.createElement("img");
        poster.src =
            `https://image.tmdb.org/t/p/w500/${movie.poster}`;
        poster.alt = `${movie.title} movie poster`;
        poster.loading = "lazy";
        poster.className =
            "h-72 w-full rounded-2xl bg-secondary object-cover " +
            "transition-transform duration-500 group-hover:scale-[1.04] md:h-80";

        poster.onerror = () => {
            poster.style.display = "none";

            const fallback = document.createElement("div");
            fallback.className =
                "flex h-72 items-center justify-center rounded-2xl " +
                "bg-secondary p-6 text-center font-black text-ink";
            fallback.textContent = movie.title;

            poster.after(fallback);
        };

        const content = document.createElement("div");
        content.className = "space-y-3 p-3";

        const title = document.createElement("h3");
        title.className = "text-xl font-black";
        title.textContent = movie.title;

        const meta = document.createElement("p");
        meta.className = "subtle text-sm";
        meta.textContent =
            `${movie.genre} • ${movie.year} • ${available(movie)} copies`;

        const prices = document.createElement("p");
        prices.className =
            "font-bold text-accent dark:text-[#cbb9ff]";
        prices.textContent =
            `Rent ${peso(movie.rent)} / 3 days • Buy ${peso(movie.buy)}`;

        const buttons = document.createElement("div");
        buttons.className = "grid grid-cols-2 gap-2";

        ["rent", "buy"].forEach(mode => {
            const button = document.createElement("button");
            button.type = "button";
            button.className =
                mode === "buy"
                    ? "action-btn !px-2"
                    : "ghost-btn !px-2";

            button.textContent =
                mode === "rent" ? "📼 Rent" : "🛒 Buy";

            button.disabled = available(movie) <= 0;

            // Both buttons use the same reliable purchase handler.
            button.addEventListener("click", () => {
                addToCart(movie.id, mode);
                impact(button);
            });

            buttons.appendChild(button);
        });

        content.append(title, meta, prices, buttons);
        card.append(poster, content);
        grid.appendChild(card);

        // Floating 3D Spatial UI effect.
        if (canAnimate()) {
            card.addEventListener("mouseenter", () => {
                gsap.to(card, {
                    y: -15,
                    rotationY: 5,
                    rotationX: 3,
                    scale: 1.035,
                    duration: 0.4,
                    ease: "power3.out",
                    overwrite: true
                });
            });

            card.addEventListener("mouseleave", () => {
                gsap.to(card, {
                    y: 0,
                    rotationY: 0,
                    rotationX: 0,
                    scale: 1,
                    duration: 0.5,
                    ease: "elastic.out(1,0.5)",
                    overwrite: true
                });
            });
        }
    });

    $("catalog-status").textContent =
        `Showing ${filtered.length} of ${movies.length} movies`;

    animateCards();

    if (hasScroll) ScrollTrigger.refresh();
}

$("search").addEventListener("input", renderMovies);

$$("#filters button").forEach(button => {
    button.addEventListener("click", () => {
        activeGenre = button.dataset.genre;

        $$("#filters button").forEach(filter => {
            const selected = filter === button;

            filter.classList.toggle("active", selected);
            filter.setAttribute("aria-pressed", String(selected));
        });

        impact(button);
        renderMovies();
    });
});

// ---------- RENT AND BUY: FIXED ----------

function addToCart(id, mode) {
    const movie = movies.find(item => item.id === id);

    if (!movie) return;

    if (reservedCopies(id) >= available(movie)) {
        showToast("No more copies available for this title.");
        return;
    }

    const existing = cart.find(item =>
        item.id === id && item.mode === mode
    );

    if (existing) {
        existing.qty++;
    } else {
        cart.push({
            id,
            mode,
            qty: 1,
            days: 3
        });
    }

    saveCart();
    cartImpact();

    showToast(
        mode === "rent"
            ? `📼 ${movie.title} added for rental!`
            : `🛒 ${movie.title} added for purchase!`
    );
}

function itemPrice(item) {
    const movie = movies.find(m => m.id === item.id);

    return item.mode === "buy"
        ? movie.buy
        : movie.rent * (item.days / 3);
}

function cartTotal() {
    return cart.reduce(
        (sum, item) => sum + itemPrice(item) * item.qty,
        0
    );
}

function saveCart() {
    save("rv-cart", cart);
    renderCart();
}

function changeQuantity(item, amount) {
    if (amount > 0) {
        const movie = movies.find(m => m.id === item.id);

        if (reservedCopies(item.id) >= available(movie)) {
            showToast("Stock limit reached.");
            return;
        }
    }

    item.qty += amount;

    if (item.qty <= 0) {
        cart = cart.filter(entry => entry !== item);
    }

    saveCart();
}

function renderCart() {
    $("cart-lines").replaceChildren();

    const count = cart.reduce((sum, item) => sum + item.qty, 0);

    $("cart-badge").textContent = count;
    $("cart-total").textContent = peso(cartTotal());
    $("checkout-open").disabled = cart.length === 0;

    if (!cart.length) {
        const empty = document.createElement("p");
        empty.className = "subtle py-10 text-center";
        empty.textContent = "Your cart is empty. Select a movie!";
        $("cart-lines").appendChild(empty);
        return;
    }

    cart.forEach(item => {
        const movie = movies.find(m => m.id === item.id);

        const row = document.createElement("div");
        row.className = "spatial-card space-y-4 !p-4";

        const heading = document.createElement("div");
        heading.className = "flex justify-between gap-3";

        const name = document.createElement("strong");
        name.textContent = movie.title;

        const type = document.createElement("span");
        type.className =
            "rounded-lg bg-secondary px-3 py-1 text-xs font-black " +
            "text-accent dark:bg-night dark:text-[#cbb9ff]";
        type.textContent =
            item.mode === "rent" ? "RENTAL" : "PURCHASE";

        heading.append(name, type);

        const controls = document.createElement("div");
        controls.className = "flex flex-wrap items-center gap-3";

        const minus = document.createElement("button");
        minus.type = "button";
        minus.className = "ghost-btn !px-3 !py-1";
        minus.textContent = "−";
        minus.setAttribute("aria-label", `Decrease ${movie.title}`);
        minus.onclick = () => changeQuantity(item, -1);

        const quantity = document.createElement("strong");
        quantity.textContent = item.qty;

        const plus = document.createElement("button");
        plus.type = "button";
        plus.className = "ghost-btn !px-3 !py-1";
        plus.textContent = "+";
        plus.setAttribute("aria-label", `Increase ${movie.title}`);
        plus.onclick = () => changeQuantity(item, 1);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "ml-auto text-sm font-bold text-red-700 underline dark:text-red-300";
        remove.textContent = "Remove";
        remove.onclick = () => {
            cart = cart.filter(entry => entry !== item);
            saveCart();
        };

        controls.append(minus, quantity, plus, remove);
        row.append(heading, controls);

        if (item.mode === "rent") {
            const label = document.createElement("label");
            label.className = "block text-sm font-bold";
            label.textContent = "Rental duration ";

            const select = document.createElement("select");
            select.className = "field mt-2";
            select.setAttribute(
                "aria-label",
                `Rental duration for ${movie.title}`
            );

            [3, 6, 9].forEach(days => {
                const option = document.createElement("option");
                option.value = days;
                option.textContent = `${days} days`;
                select.appendChild(option);
            });

            select.value = item.days;

            select.addEventListener("change", () => {
                item.days = Number(select.value);
                saveCart();
            });

            label.appendChild(select);
            row.appendChild(label);
        }

        const price = document.createElement("p");
        price.className =
            "text-right text-lg font-black text-accent dark:text-[#cbb9ff]";
        price.textContent = peso(itemPrice(item) * item.qty);

        row.appendChild(price);
        $("cart-lines").appendChild(row);
    });
}

// ---------- SHOPPING CART ----------

$("cart-open").addEventListener("click", () => {
    renderCart();
    openDialog("cart-dialog");
});

$("cart-close").addEventListener("click", () => {
    closeDialog("cart-dialog");
});

// ---------- CHECKOUT ----------

$("checkout-open").addEventListener("click", () => {
    if (!cart.length) return;

    $("cart-dialog").close();

    $("checkout-total").textContent =
        `Total amount: ${peso(cartTotal())}`;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const date = new Date(
        tomorrow.getTime() -
        tomorrow.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 10);

    $("pickup-date").min = date;

    openDialog("checkout-dialog");
});

$("checkout-close").addEventListener("click", () => {
    closeDialog("checkout-dialog");
});

$("checkout-form").addEventListener("submit", event => {
    event.preventDefault();

    if (!cart.length) return;

    const name = $("buyer-name").value.trim();
    const email = $("buyer-email").value.trim();
    const date = $("pickup-date").value;

    if (!name || !email || !date) return;

    const order = {
        number: `RV-${Date.now()}`,
        name,
        email,
        date,
        items: cart.map(item => ({...item})),
        total: cartTotal(),
        created: new Date().toLocaleString("en-PH")
    };

    orders.unshift(order);
    save("rv-orders", orders);

    const lines = order.items.map(item => {
        const movie = movies.find(m => m.id === item.id);

        const due = item.mode === "rent"
            ? ` • ${item.days}-day rental`
            : "";

        return `${movie.title} ×${item.qty} (${item.mode})${due}`;
    });

    receiptText = [
        "REELVAULT — MOVIE RENTAL & COLLECTIBLES",
        `Order: ${order.number}`,
        `Customer: ${order.name}`,
        `Pickup date: ${order.date}`,
        "",
        ...lines,
        "",
        `TOTAL: ${peso(order.total)}`,
        "DEMO ONLY — No payment was made."
    ].join("\n");

    cart = [];
    saveCart();
    renderMovies();

    const receipt = document.createElement("p");
    receipt.className = "whitespace-pre-line leading-8";
    receipt.textContent = receiptText;

    $("receipt-content").replaceChildren(receipt);

    $("checkout-dialog").close();
    $("checkout-form").reset();

    $("receipt-copy").textContent = "Copy receipt";
    openDialog("receipt-dialog");

    if (canAnimate()) {
        gsap.fromTo("#receipt-content", {
            opacity: 0,
            scale: 0.65,
            rotationX: -30
        }, {
            opacity: 1,
            scale: 1,
            rotationX: 0,
            duration: 1,
            ease: "elastic.out(1,0.5)"
        });
    }

    showToast("✓ Demo order successfully confirmed!");
});

$("receipt-close").addEventListener("click", () => {
    closeDialog("receipt-dialog");
});

$("receipt-copy").addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(receiptText);
        $("receipt-copy").textContent = "✓ Copied!";
        impact($("receipt-copy"));
    } catch {
        showToast("Clipboard unavailable in this browser.");
    }
});

// ---------- ORDER HISTORY ----------

$("orders-open").addEventListener("click", () => {
    const list = $("orders-list");
    list.replaceChildren();

    if (!orders.length) {
        const empty = document.createElement("p");
        empty.className = "subtle py-6 text-center";
        empty.textContent = "No demo orders yet.";
        list.appendChild(empty);
    }

    orders.forEach(order => {
        const card = document.createElement("article");
        card.className = "spatial-card space-y-2 !p-4";

        const number = document.createElement("h3");
        number.className = "font-black";
        number.textContent = order.number;

        const details = document.createElement("p");
        details.className = "subtle text-sm";
        details.textContent =
            `${order.created} • ${order.name} • Pickup ${order.date}`;

        const amount = document.createElement("p");
        amount.className =
            "font-black text-accent dark:text-[#cbb9ff]";
        amount.textContent = peso(order.total);

        card.append(number, details, amount);
        list.appendChild(card);
    });

    openDialog("orders-dialog");

    if (canAnimate()) {
        gsap.fromTo("#orders-list > *", {
            opacity: 0,
            x: -70,
            rotationY: -25
        }, {
            opacity: 1,
            x: 0,
            rotationY: 0,
            duration: 0.65,
            stagger: 0.1,
            ease: "back.out(2)"
        });
    }
});

$("orders-close").addEventListener("click", () => {
    closeDialog("orders-dialog");
});

// ---------- CONTACT ----------

$("contact-form").addEventListener("submit", event => {
    event.preventDefault();

    $("contact-feedback").textContent =
        "✓ Form validated! Demo only — no message was sent.";

    if (canAnimate()) {
        gsap.fromTo("#contact-feedback", {
            opacity: 0,
            scale: 0.5,
            y: 40
        }, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.75,
            ease: "elastic.out(1,0.4)"
        });
    }

    $("contact-form").reset();
});

// ---------- CINEMATIC INTRO ----------

function setupAnimations() {
    if (!canAnimate()) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({
            defaults: {
                duration: 0.55,
                ease: "power4.out"
            }
        });

        intro
            .from(".brand", {
                opacity: 0,
                y: -70,
                rotationX: -70
            })
            .from(".hero-heading", {
                opacity: 0,
                x: -150,
                rotationY: -30,
                filter: "blur(14px)",
                duration: 0.85
            }, "-=0.25")
            .from(".hero-piece", {
                opacity: 0,
                y: 70,
                scale: 0.75,
                stagger: 0.12,
                duration: 0.65
            }, "-=0.55")
            .from(".hero-visual", {
                opacity: 0,
                x: 130,
                rotationY: 55,
                rotationX: -18,
                scale: 0.6,
                duration: 1,
                ease: "back.out(1.8)"
            }, "-=0.65");

        const replay = () => intro.restart();
        $("replay").addEventListener("click", replay);

        $$(".reveal").forEach(section => {
            gsap.fromTo(section, {
                opacity: 0,
                y: 110,
                scale: 0.9,
                rotationX: 8,
                filter: "blur(10px)"
            }, {
                opacity: 1,
                y: 0,
                scale: 1,
                rotationX: 0,
                filter: "blur(0px)",
                duration: 1.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            });
        });

        if (hasScroll) {
            gsap.to("#progress", {
                scaleX: 1,
                ease: "none",
                scrollTrigger: {
                    trigger: document.documentElement,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: true
                }
            });
        }

        return () => {
            $("replay").removeEventListener("click", replay);
        };
    });
}

// ---------- START APPLICATION ----------

renderMovies();
renderCart();
setupAnimations();
