// Example starter JavaScript for disabling form submissions if there are invalid fields
(function() {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
        .forEach(function(form) {
            form.addEventListener('submit', function(event) {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }

                form.classList.add('was-validated')
            }, false)
        })
})()

const taxSwitch = document.getElementById("taxSwitch");

if (taxSwitch) {
    const GST = 0.18;

    taxSwitch.addEventListener("change", () => {
        document.querySelectorAll(".price").forEach((el) => {
            const base = Number(el.dataset.price);
            if (!base) return; // skip listings with no price

            const amount = taxSwitch.checked ? Math.round(base * (1 + GST)) : base;
            el.innerHTML = "&#8377; " + amount.toLocaleString("en-IN");
        });

        document.querySelectorAll(".tax-info").forEach((el) => {
            el.style.display = taxSwitch.checked ? "inline" : "none";
        });
    });
}