import { db } from './firebase.js'; 
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function obterDataHojeISO() {
    return new Date().toISOString().split('T')[0];
}

// coleção do firestore
const projetosRef = collection(db, 'projetosEstudantes');
let projetos = []; 
let projetoAtualId = null;

// Selectores
const corpoTabela = document.getElementById('corpoTabela');
const modalDetalhes = document.getElementById('modalDetalhes');
const fecharBtnDetalhes = document.querySelector('.close');
const nomeProjetoEl = document.getElementById('nomeProjeto');
const temaProjetoEl = document.getElementById('temaProjeto');
const estadoProjetoSelect = document.getElementById('estadoProjetoSelect');
const ultimaAtualizacaoInput = document.getElementById('ultimaAtualizacaoInput');
const notaProjetoInput = document.getElementById('notaProjetoInput'); 
const comentariosDocente = document.getElementById('comentariosDocente'); 
const btnExcluirProjeto = document.getElementById('btnExcluirProjeto');
const btnEditarProjeto = document.getElementById('btnEditarProjeto');
const addEstudanteBtn = document.getElementById('addEstudanteBtn');
const modalAddEstudante = document.getElementById('modalAddEstudante');
const fecharBtnAdd = document.querySelector('.fechar-btn-add');
const formNovoEstudante = document.getElementById('formNovoEstudante');
const btnBaixarRelatorio = document.getElementById('btnBaixarRelatorio');
const barraPesquisa = document.getElementById('barraPesquisa');

function montarBadgeEstado(estado) {
    const span = document.createElement('span');
    span.classList.add('status-badge'); 
    let iconClass = '';
    let statusText = estado;

    if (estado === 'Concluído') { 
        span.classList.add('status-concluido');
        iconClass = 'fas fa-check-circle'; 
    } else if (estado === 'Em Andamento') { 
        span.classList.add('status-andamento');
        iconClass = 'fas fa-spinner fa-pulse'; 
    } else if (estado === 'Pendente') { 
        span.classList.add('status-pendente');
        iconClass = 'fas fa-exclamation-triangle'; 
    }
    
    const icon = document.createElement('i');
    icon.className = iconClass;
    span.appendChild(icon);
    span.appendChild(document.createTextNode(` ${statusText}`));
    return span;
}

//Tabela 
function popularTabela(listaProjetos) {
    corpoTabela.innerHTML = '';
    listaProjetos.forEach(projeto => {
        const linha = corpoTabela.insertRow();

        const celulaNome = linha.insertCell();
        const tooltipContainer = document.createElement('div');
        tooltipContainer.className = 'tooltip-container';

        const nota = projeto.nota !== null && projeto.nota !== undefined ? projeto.nota : 'SN';
        const observacoes = projeto.comentarios ? projeto.comentarios.trim() : 'Nenhuma observação.';
        
        let tooltipContentText = `Nota: ${nota}\n\n`;
        const obsPreview = observacoes.substring(0, 150);
        tooltipContentText += `Observações:\n${obsPreview}${observacoes.length > 150 ? '...' : ''}`;

        const tooltipContent = document.createElement('span');
        tooltipContent.className = 'tooltip-content';
        tooltipContent.textContent = tooltipContentText;
        
        tooltipContainer.textContent = projeto.nome;
        tooltipContainer.appendChild(tooltipContent);
        
        celulaNome.appendChild(tooltipContainer);
        linha.insertCell().textContent = projeto.tema;
        linha.insertCell().textContent = projeto.ultimaAtualizacao;
        linha.insertCell().textContent = projeto.nota || 'SN';
        const celulaEstado = linha.insertCell();
        celulaEstado.appendChild(montarBadgeEstado(projeto.estado));
        linha.onclick = () => abrirModal(projeto.id);
    });
}
async function carregarProjetos() {
    projetos = [];
    const snapshot = await getDocs(projetosRef);
    snapshot.forEach(docSnap => projetos.push({ id: docSnap.id, ...docSnap.data() }));
    popularTabela(projetos);
}
function filtrarProjetos() {
    const termo = barraPesquisa.value.toLowerCase().trim();

    if (termo === "") {
        popularTabela(projetos);
        return;
    }

    const projetosFiltrados = projetos.filter(projeto => {
        return projeto.nome.toLowerCase().includes(termo) ||
                projeto.tema.toLowerCase().includes(termo);
    });

    popularTabela(projetosFiltrados);
}

// Adicionar novo estudante
async function salvarNovoEstudante(nome, tema) {
    await addDoc(projetosRef, {
        nome,
        tema,
        estado: "Pendente",
        ultimaAtualizacao: obterDataHojeISO(),
        comentarios: "",
        nota: null, 
    });
    modalAddEstudante.style.display = 'none';
    formNovoEstudante.reset();
    
    await carregarProjetos();
    filtrarProjetos();

    Swal.fire({
        title: 'Sucesso!',
        text: `O projeto de ${nome} foi adicionado.`,
        icon: 'success',
        confirmButtonText: 'Ok'
    });
}

// Abrir modal 
function abrirModal(projetoId) {
    const projeto = projetos.find(p => p.id === projetoId);

    if (!projeto) {
        Swal.fire({
            title: 'Erro!',
            text: 'Projeto não encontrado.',
            icon: 'error',
            confirmButtonText: 'Ok'
        });
        return;
    }
    
    projetoAtualId = projetoId;

    // Mostrar dados
    nomeProjetoEl.textContent = projeto.nome;
    temaProjetoEl.textContent = projeto.tema;

    estadoProjetoSelect.value = projeto.estado;
    ultimaAtualizacaoInput.value = projeto.ultimaAtualizacao;
    notaProjetoInput.value = projeto.nota !== null && projeto.nota !== undefined ? projeto.nota : '';
    notaProjetoInput.disabled = true;
    comentariosDocente.value = projeto.comentarios || "";
    estadoProjetoSelect.disabled = true;
    ultimaAtualizacaoInput.disabled = true;
    comentariosDocente.disabled = true;

    // Botão Editar
    btnEditarProjeto.textContent = "Editar";
    btnEditarProjeto.onclick = () => habilitarEdicao();

    modalDetalhes.style.display = 'block';
}
//funcao para edicao
function habilitarEdicao() {
    estadoProjetoSelect.disabled = false;
    ultimaAtualizacaoInput.disabled = false;
    comentariosDocente.disabled = false;
    notaProjetoInput.disabled = false; 

    btnEditarProjeto.textContent = "Guardar Alterações";
    btnEditarProjeto.onclick = guardarAlteracoes;
}

// Guardar alterações 
async function guardarAlteracoes() {
    const projetoDocRef = doc(db, 'projetosEstudantes', projetoAtualId);
    let novaNota = notaProjetoInput.value === "" ? null : parseFloat(notaProjetoInput.value);
    let updatePayload = {
        estado: estadoProjetoSelect.value,
        ultimaAtualizacao: ultimaAtualizacaoInput.value,
        comentarios: comentariosDocente.value,
        nota: novaNota, 
    };
    await updateDoc(projetoDocRef, updatePayload);
    modalDetalhes.style.display = 'none';
    await carregarProjetos();
    filtrarProjetos();

    Swal.fire({
        title: 'Salvo!',
        text: 'As alterações do projeto foram guardadas com sucesso.',
        icon: 'success',
        confirmButtonText: 'Ok'
    });
}

// funcao para excluir projecto
async function excluirProjeto() {
    

    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: "Você não poderá reverter isso!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    const projetoDoc = doc(db, 'projetosEstudantes', projetoAtualId);
    await deleteDoc(projetoDoc);
    modalDetalhes.style.display = 'none';
    
    await carregarProjetos();
    filtrarProjetos();

    Swal.fire(
        'Excluído!',
        'O projeto foi excluído com sucesso.',
        'success'
    );
}

// Função para baixar o relatório 
function baixarRelatorio() {
    
    if (projetos.length === 0) {
        Swal.fire({
            title: 'Atenção',
            text: 'Não há dados para exportar.',
            icon: 'info',
            confirmButtonText: 'Ok'
        });
        return;
    }
    
    const headers = ["Nome do Estudante", "Tema", "Última Atualização", "Nota", "Estado", "Observações"];
    const csvData = projetos.map(p => ({
        "Nome do Estudante": p.nome,
        "Tema": p.tema,
        "Última Atualização": p.ultimaAtualizacao,
        "Nota": p.nota !== null && p.nota !== undefined ? String(p.nota).replace('.', ',') : '', 
        "Estado": p.estado,
        "Observações": p.comentarios 
            ? p.comentarios.replace(/\n/g, ' ').replace(/"/g, '""') 
            : '', 
    }));
    let csv = headers.join(";") + "\n"; 
    
    csvData.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];
            if (value && (value.includes(";") || value.includes('"'))) {
                value = `"${value}"`;
            } else if (!value) {
                value = "";
            }
            return value;
        });
        csv += values.join(";") + "\n";
    });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Projetos_${obterDataHojeISO()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
        title: 'Download Concluído!',
        text: 'O relatório foi baixado com sucesso no formato CSV.',
        icon: 'success',
        confirmButtonText: 'Obrigado'
    });
}
// Eventos
document.addEventListener('DOMContentLoaded', async () => {
    await carregarProjetos(); 

    addEstudanteBtn.onclick = () => modalAddEstudante.style.display = 'block';
    fecharBtnAdd.onclick = () => modalAddEstudante.style.display = 'none';
    fecharBtnDetalhes.onclick = () => modalDetalhes.style.display = 'none';

    formNovoEstudante.addEventListener('submit', async e => {
        e.preventDefault();
        await salvarNovoEstudante(
            document.getElementById('novoNome').value,
            document.getElementById('novoTema').value
        );
    });

    btnExcluirProjeto.onclick = excluirProjeto;

    window.onclick = e => {
        if (e.target === modalDetalhes) modalDetalhes.style.display = 'none';
        if (e.target === modalAddEstudante) modalAddEstudante.style.display = 'none';
    };
    barraPesquisa.addEventListener('input', filtrarProjetos);
    btnBaixarRelatorio.onclick = baixarRelatorio;
});


