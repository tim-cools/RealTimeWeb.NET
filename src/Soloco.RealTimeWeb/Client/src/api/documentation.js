import api from './';
import { actions as documentationStateActions } from '../state/documentation';

function getDocuments() {

    function handleResponse(response) {
        documentationStateActions.loaded(response);
    }

    function handleError(errors) {
        documentationStateActions.error("Error while loading");
    }

    api.post('api/documents', data, handleResponse, handleError);
}

function getDocument(id) {

    function handleResponse(response) {
        documentationStateActions.documentLoaded(response);
    }

    function handleError(errors) {
        documentationStateActions.documentError("Error while loading");
    }

    api.post('api/documents/' + id, data, handleResponse, handleError);
}

export default {
    getDocuments: getDocuments,
    getDocument: getDocument
}