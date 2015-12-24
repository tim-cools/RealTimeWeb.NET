import api from './';
import { actions as documentationStateActions } from '../state/documentation';

function getDocuments() {

    function handleResponse(response) {
        documentationStateActions.loaded(response);
    }

    function handleError(errors) {
        documentationStateActions.error('Error while loading');
    }

    api.get('api/documents', null, handleResponse, handleError);
}

function getDocument(id) {

    function handleResponse(response) {
        documentationStateActions.documentLoaded(id, response.Content ? response.Content : 'empty');
    }

    function handleError(errors) {
        documentationStateActions.documentError(id, 'Error while loading');
    }

    api.get('api/documents/' + id, null, handleResponse, handleError);
}

export default {
    getDocuments: getDocuments,
    getDocument: getDocument
}