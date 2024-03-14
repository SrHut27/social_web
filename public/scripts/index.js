document.addEventListener('DOMContentLoaded', function(){
        
    const toggleButtons = document.querySelectorAll('.toggleButton');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const postId = button.id.replace('toggleButton', '');
            const comentariosDiv = document.getElementById(`comentarios${postId}`);
            if (comentariosDiv.style.display === 'none') {
                comentariosDiv.style.display = 'block';
                button.textContent = 'Esconder comentários';
            } else {
                comentariosDiv.style.display = 'none';
                button.textContent = 'Mostrar comentários';
            }
        });
    });

});