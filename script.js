
gsap.registerPlugin(ScrollTrigger);

const $ = id => document.getElementById(id);
const money = n => "₱" + n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});
const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
};
const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch {}
};
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

const movies = [
    {id:"interstellar",title:"Interstellar",genre:"Sci-Fi",year:2014,stock:5,rent:85,buy:390,poster:"gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"},
    {id:"inception",title:"Inception",genre:"Sci-Fi",year:2010,stock:6,rent:75,buy:350,poster:"oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"},
    {id:"dark-knight",title:"The Dark Knight",genre:"Action",year:2008,stock:4,rent:80,buy:375,poster:"qJ2tW6WMUDux911r6m7haRef0WH.jpg"},
    {id:"oppenheimer",title:"Oppenheimer",genre:"Drama",year:2023,stock:4,rent:95,buy:450,poster:"8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"},
    {id:"endgame",title:"Avengers: Endgame",genre:"Action",year:2019,stock:6,rent:90,buy:425,poster:"or06FN3Dka5tukK1e9sl16pB3iy.jpg"},
    {id:"spiderverse",title:"Into the Spider-Verse",genre:"Animation",year:2018,stock:5,rent:80,buy:360,poster:"iiZZdoQBEYBv6id8su7ImL0oCbD.jpg"},
    {id:"shawshank",title:"The Shawshank Redemption",genre:"Drama",year:1994,stock:3,rent:70,buy:325,poster:"9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg"},
    {id:"wall-e",title:"WALL·E",genre:"Animation",year:2008,stock:5,rent:75,buy:345,poster:"hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg"}
];

let cart = read("rv-cart", []);
let orders = read("rv-orders", []);
let genre = "All";
let receiptText = "";

const dark = () => document.documentElement.classList.contains("dark");

function themeUI() {
    $("theme-toggle").textContent = dark() ? "☀ Light" : "☾ Dark";
    $("theme-toggle").setAttribute("aria-pressed", String(dark()));
}

if (read("rv-dark", false)) document.documentElement.classList.add("dark");
themeUI();

$("theme-toggle").onclick = () => {
    document.documentElement.classList.toggle("dark");
    save("rv-dark", dark());
    themeUI();
};

$("nav-toggle").onclick = () => {
    const open = $("nav-links").classList.contains("hidden");
    $("nav-links").classList.toggle("hidden", !open);
    $("nav-links").classList.toggle("flex", open);
    $("nav-toggle").setAttribute("aria-expanded", String(open));
};

$("nav-links").querySelectorAll("a").forEach(link => {
    link.onclick = () => {
        $("nav-links").classList.add("hidden");
        $("nav-links").classList.remove("flex");
        $("nav-toggle").setAttribute("aria-expanded", "false");
    };
});

function available(movie) {
    const purchased = orders.reduce((sum, order) =>
        sum + order.items
            .filter(item => item.id === movie.id && item.mode === "buy")
            .reduce((count, item) => count + item.qty, 0), 0);

    return Math.max(0, movie.stock - purchased);
}

function renderMovies() {
    const term = $("search").value.toLowerCase().trim();
    const filtered = movies.filter(movie =>
        (genre === "All" || movie.genre === genre) &&
        `${movie.title} ${movie.year} ${movie.genre}`.toLowerCase().includes(term)
    );

    $("movie-grid").replaceChildren();

    filtered.forEach(movie => {
        const card = document.createElement("article");
        card.className = "spatial-card overflow-hidden !p-3";

        const poster = document.createElement("img");
        poster.src = `https://image.tmdb.org/t/p/w500/${movie.poster}`;
        poster.alt = `${movie.title} movie poster`;
        poster.loading = "lazy";
        poster.className = "h-72 w-full rounded-2xl bg-secondary object-cover md:h-80";
        poster.onerror = () => {
            poster.style.display = "none";
            const fallback = document.createElement("p");
            fallback.className = "rounded-2xl bg-secondary p-8 text-center font-bold text-ink";
            fallback.textContent = `${movie.title} — poster unavailable`;
            poster.after(fallback);
        };

        const info = document.createElement("div");
        info.className = "space-y-3 p-3";

        const title = document.createElement("h3");
        title.className = "text-xl font-black";
        title.textContent = movie.title;

        const meta = document.createElement("p");
        meta.className = "subtle text-sm";
        meta.textContent =
            `${movie.genre} • ${movie.year} • ${available(movie)} copies available`;

        const price = document.createElement("p");
        price.className = "font-bold text-accent dark:text-[#cbb9ff]";
        price.textContent =
            `Rent ${money(movie.rent)} / 3 days • Buy ${money(movie.buy)}`;

        const buttons = document.createElement("div");
        buttons.className = "grid grid-cols-2 gap-2";

        ["rent", "buy"].forEach(mode => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = mode === "buy"
                ? "action-btn !px-2"
                : "ghost-btn !px-2";
            button.textContent = mode === "rent" ? "Rent tape" : "Buy tape";
            button.disabled = available(movie) < 1;
            button.onclick = () => add(movie.id, mode);
            buttons.append(button);
        });

        info.append(title, meta, price, buttons);
        card.append(poster, info);
        $("movie-grid").append(card);
    });

    $("catalog-status").textContent =
        `Showing ${filtered.length} of ${movies.length} titles`;

    ScrollTrigger.refresh();
}

$("search").addEventListener("input", renderMovies);

$("filters").querySelectorAll("button").forEach(button => {
    button.onclick = () => {
        genre = button.dataset.genre;

        $("filters").querySelectorAll("button").forEach(item => {
            const selected = item === button;
            item.classList.toggle("active", selected);
            item.setAttribute("aria-pressed", String(selected));
        });

        renderMovies();
    };
});

function add(id, mode) {
    const movie = movies.find(item => item.id === id);
    const existing = cart.find(item => item.id === id && item.mode === mode);
    const reserved = cart
        .filter(item => item.id === id)
        .reduce((sum, item) => sum + item.qty, 0);

    if (reserved >= available(movie)) {
        alert("No more copies are available in this demo.");
        return;
    }

    if (existing) existing.qty++;
    else cart.push({id, mode, qty:1, days:3});

    persist();

    if (!reduced.matches) {
        gsap.fromTo("#cart-open", {scale:1.12}, {
            scale:1,
            duration:0.35,
            ease:"back.out(2)"
        });
    }
}

function itemPrice(item) {
    const movie = movies.find(m => m.id === item.id);
    return item.mode === "buy"
        ? movie.buy
        : movie.rent * Math.ceil(item.days / 3);
}

function total() {
    return cart.reduce((sum, item) => sum + itemPrice(item) * item.qty, 0);
}

function persist() {
    save("rv-cart", cart);
    renderCart();
}

function change(item, delta) {
    if (delta > 0) {
        const movie = movies.find(m => m.id === item.id);
        const reserved = cart
            .filter(i => i.id === item.id)
            .reduce((sum, i) => sum + i.qty, 0);

        if (reserved >= available(movie)) return;
    }

    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i !== item);
    persist();
}

function renderCart() {
    $("cart-badge").textContent = cart.reduce((sum, i) => sum + i.qty, 0);
    $("cart-total").textContent = money(total());
    $("cart-lines").replaceChildren();

    if (!cart.length) {
        const empty = document.createElement("p");
        empty.className = "subtle py-8 text-center";
        empty.textContent = "Your cart is empty. Browse the movie catalog!";
        $("cart-lines").append(empty);
    }

    cart.forEach(item => {
        const movie = movies.find(m => m.id === item.id);
        const row = document.createElement("div");
        row.className = "spatial-card space-y-3 !p-4";

        const heading = document.createElement("p");
        heading.className = "font-bold";
        heading.textContent =
            `${movie.title} — ${item.mode === "rent" ? "Rental" : "Purchase"}`;

        const controls = document.createElement("div");
        controls.className = "flex flex-wrap items-center gap-2";

        const minus = document.createElement("button");
        minus.className = "ghost-btn !px-3 !py-1";
        minus.textContent = "−";
        minus.setAttribute("aria-label", `Decrease ${movie.title}`);
        minus.onclick = () => change(item, -1);

        const count = document.createElement("span");
        count.textContent = `${item.qty} copy/copies`;

        const plus = document.createElement("button");
        plus.className = "ghost-btn !px-3 !py-1";
        plus.textContent = "+";
        plus.setAttribute("aria-label", `Increase ${movie.title}`);
        plus.onclick = () => change(item, 1);

        const remove = document.createElement("button");
        remove.className = "ghost-btn !px-3 !py-1";
        remove.textContent = "Remove";
        remove.onclick = () => {
            cart = cart.filter(i => i !== item);
            persist();
        };

        controls.append(minus, count, plus, remove);
        row.append(heading, controls);

        if (item.mode === "rent") {
            const label = document.createElement("label");
            label.textContent = "Rental period: ";

            const select = document.createElement("select");
            select.className = "field !w-auto !p-2";
            select.setAttribute("aria-label", `Rental period for ${movie.title}`);

            [3, 6, 9].forEach(days => {
                const option = document.createElement("option");
                option.value = days;
                option.textContent = `${days} days`;
                select.append(option);
            });

            select.value = item.days;
            select.onchange = () => {
                item.days = Number(select.value);
                persist();
            };

            label.append(select);
            row.append(label);
        }

        const price = document.createElement("p");
        price.className = "font-bold text-accent dark:text-[#cbb9ff]";
        price.textContent = money(itemPrice(item) * item.qty);

        row.append(price);
        $("cart-lines").append(row);
    });

    $("checkout-open").disabled = !cart.length;
}

$("cart-open").onclick = () => $("cart-dialog").showModal();
$("cart-close").onclick = () => $("cart-dialog").close();

$("checkout-open").onclick = () => {
    if (!cart.length) return;

    $("cart-dialog").close();
    $("checkout-total").textContent = `Order total: ${money(total())}`;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const localDate = new Date(
        tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 10);

    $("pickup-date").min = localDate;
    $("checkout-dialog").showModal();
};

$("checkout-close").onclick = () => $("checkout-dialog").close();

$("checkout-form").onsubmit = event => {
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
        total: total(),
        created: new Date().toLocaleString("en-PH")
    };

    orders.unshift(order);
    save("rv-orders", orders);

    cart = [];
    persist();
    renderMovies();

    const lines = order.items.map(item => {
        const movie = movies.find(m => m.id === item.id);
        const due = item.mode === "rent"
            ? `, ${item.days}-day rental`
            : "";
        return `${movie.title} (${item.mode}) ×${item.qty}${due}`;
    });

    receiptText = [
        `REELVAULT — ${order.number}`,
        `Customer: ${name}`,
        `Pickup: ${date}`,
        ...lines,
        `Total: ${money(order.total)}`,
        "DEMO ONLY — No payment taken."
    ].join("\n");

    $("receipt-content").replaceChildren();

    const receipt = document.createElement("p");
    receipt.className = "whitespace-pre-line";
    receipt.textContent = receiptText;
    $("receipt-content").append(receipt);

    $("checkout-dialog").close();
    $("checkout-form").reset();
    $("receipt-copy").textContent = "Copy receipt";
    $("receipt-dialog").showModal();
};

$("receipt-close").onclick = () => $("receipt-dialog").close();

$("receipt-copy").onclick = async () => {
    try {
        await navigator.clipboard.writeText(receiptText);
        $("receipt-copy").textContent = "Copied!";
    } catch {
        $("receipt-copy").textContent = "Copy unavailable";
    }
};

$("orders-open").onclick = () => {
    $("orders-list").replaceChildren();

    orders.forEach(order => {
        const card = document.createElement("div");
        card.className = "spatial-card !p-4";
        card.textContent =
            `${order.number} • ${order.created} • ${order.name} • ` +
            `${money(order.total)} • Pickup: ${order.date}`;
        $("orders-list").append(card);
    });

    if (!orders.length) {
        $("orders-list").textContent = "No demo orders yet.";
    }

    $("orders-dialog").showModal();
};

$("orders-close").onclick = () => $("orders-dialog").close();

$("contact-form").onsubmit = event => {
    event.preventDefault();
    $("contact-feedback").textContent =
        "Form validated. Demo only: no message was sent.";
    $("contact-form").reset();
};

// GSAP timeline and ScrollTrigger
const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
    // power3.out: energetic cinematic entrance.
    // power2.out: gentle section reveal.
    const intro = gsap.timeline({
        defaults: {
            duration: 0.5,
            ease: "power3.out"
        }
    });

    intro
        .from(".brand", {
            opacity: 0,
            y: -25
        })
        .from(".hero-heading", {
            opacity: 0,
            y: 55,
            duration: 0.65
        }, "-=0.3")
        .from(".hero-piece", {
            opacity: 0,
            y: 30,
            stagger: 0.1
        }, "-=0.4")
        .from(".hero-visual", {
            opacity: 0,
            y: 35,
            scale: 0.94,
            duration: 0.6
        }, "<");

    const replay = () => intro.restart();
    $("replay").addEventListener("click", replay);

    gsap.utils.toArray(".reveal").forEach(section => {
        gsap.from(section, {
            opacity: 0,
            y: 45,
            duration: 0.75,
            ease: "power2.out",
            scrollTrigger: {
                trigger: section,
                start: "top 88%",
                toggleActions: "play none none none"
            }
        });
    });

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

    return () => {
        $("replay").removeEventListener("click", replay);
    };
});

renderMovies();
renderCart();
