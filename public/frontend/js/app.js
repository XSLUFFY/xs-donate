/*==================================================
            XS DONATE
            APP.JS
==================================================*/

"use strict";

/*=====================================
            MENU MOBILE
======================================*/

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("nav");

if (menuButton) {

    menuButton.addEventListener("click", () => {

        navigation.classList.toggle("active");

    });

}

/*=====================================
          HEADER SCROLL
======================================*/

const header = document.querySelector("header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 60) {

        header.classList.add("header-scroll");

    } else {

        header.classList.remove("header-scroll");

    }

});

/*=====================================
        REVEAL ANIMATION
======================================*/

const reveals = document.querySelectorAll(".feature,.card,.info-card,.advantages div");

function revealAnimation() {

    reveals.forEach(element => {

        const top = element.getBoundingClientRect().top;

        if (top < window.innerHeight - 120) {

            element.classList.add("show");

        }

    });

}

window.addEventListener("scroll", revealAnimation);

revealAnimation();

/*=====================================
        BUTTON RIPPLE
======================================*/

document.querySelectorAll(".btn-primary,.dashboard-btn").forEach(button => {

    button.addEventListener("click", function(e){

        const circle = document.createElement("span");

        const diameter = Math.max(this.clientWidth,this.clientHeight);

        circle.style.width = diameter + "px";

        circle.style.height = diameter + "px";

        circle.classList.add("ripple");

        const rect = this.getBoundingClientRect();

        circle.style.left = (e.clientX - rect.left - diameter/2) + "px";

        circle.style.top = (e.clientY - rect.top - diameter/2) + "px";

        this.appendChild(circle);

        setTimeout(()=>{

            circle.remove();

        },600);

    });

});

/*=====================================
          COUNTER
======================================*/

const counters = document.querySelectorAll("[data-counter]");

function animateCounter(counter){

    const target = Number(counter.dataset.counter);

    let value = 0;

    const increment = Math.max(1, Math.ceil(target / 120));

    const timer = setInterval(()=>{

        value += increment;

        if(value >= target){

            value = target;

            clearInterval(timer);

        }

        counter.innerText = value.toLocaleString("pt-BR");

    },15);

}

const observer = new IntersectionObserver(entries=>{

    entries.forEach(entry=>{

        if(entry.isIntersecting){

            animateCounter(entry.target);

            observer.unobserve(entry.target);

        }

    });

});

counters.forEach(counter=>{

    observer.observe(counter);

});

/*=====================================
          LOADER
======================================*/

window.addEventListener("load",()=>{

    const loader = document.querySelector(".loader");

    if(loader){

        loader.style.opacity="0";

        setTimeout(()=>{

            loader.remove();

        },400);

    }

});

/*=====================================
          TOAST
======================================*/

function toast(message,type="success"){

    const toast = document.createElement("div");

    toast.className="toast " + type;

    toast.innerHTML=message;

    document.body.appendChild(toast);

    setTimeout(()=>{

        toast.classList.add("visible");

    },50);

    setTimeout(()=>{

        toast.classList.remove("visible");

        setTimeout(()=>{

            toast.remove();

        },300);

    },3000);

}

/*=====================================
          MODAL
======================================*/

function openModal(id){

    const modal=document.getElementById(id);

    if(modal){

        modal.classList.add("open");

    }

}

function closeModal(id){

    const modal=document.getElementById(id);

    if(modal){

        modal.classList.remove("open");

    }

}

/*=====================================
      SWITCH TEMA
======================================*/

const themeButton=document.querySelector("#themeSwitch");

if(themeButton){

    const savedTheme=localStorage.getItem("theme");

    if(savedTheme==="light"){

        document.body.classList.add("light-theme");

    }

    themeButton.addEventListener("click",()=>{

        document.body.classList.toggle("light-theme");

        const current=document.body.classList.contains("light-theme") ? "light":"dark";

        localStorage.setItem("theme",current);

    });

}

/*=====================================
        COPY PIX
======================================*/

function copyPix(code){

    navigator.clipboard.writeText(code);

    toast("Código PIX copiado!");

}

/*=====================================
      FORMATAR MOEDA
======================================*/

function formatMoney(value){

    return Number(value).toLocaleString("pt-BR",{

        style:"currency",

        currency:"BRL"

    });

}

/*=====================================
      DATA ATUAL
======================================*/

function currentDate(){

    return new Date().toLocaleDateString("pt-BR");

}

/*=====================================
        LOG
======================================*/

console.log("%cXS Donate iniciado com sucesso.","color:#00E5FF;font-size:18px;font-weight:bold;");