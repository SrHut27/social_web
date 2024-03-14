document.addEventListener('DOMContentLoaded', function(){
        
    function toggleDiv(){

        const div = document.getElementById('comentarios');
        if(div.style.display   == 'none'){
            div.style.display = 'block';
        } else {
            div.style.display = 'none';
        };
    };

    const button = document.getElementById('toggleButton');
    if(button) {
        button.addEventListener('click', toggleDiv)
    }

});