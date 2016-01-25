import { dispatch } from './dispatcher';

export const actionsDefinitions = {
    LOADED: 'LOADED',
    ERROR: 'ERROR',
    
    DOCUMENT_LOADED: 'DOCUMENT_LOADED',
    DOCUMENT_ERROR: 'DOCUMENT_ERROR'
};

export const actions = {
    loaded: function(documents) {
        return dispatch({
            type: actionsDefinitions.LOADED,
            documents: documents
        });
    },

    error: function(error) {
        return dispatch({
            type: actionsDefinitions.ERROR,
            error: error
        });
    },

    documentLoaded: function(id, document) {
        return dispatch({
            type: actionsDefinitions.DOCUMENT_LOADED,
            id: id,
            document: document
        });
    },

    documentError: function(id, error) {
        return dispatch({
            type: actionsDefinitions.DOCUMENT_ERROR,
            id: id,
            error: error
        });
    }
};

export function reducer(state = {}, action) {
    switch (action.type) {
        case actionsDefinitions.LOADED:
            return {
                headers: action.documents
            };

        case actionsDefinitions.ERROR:
            return {
                headers: action.error
            };

        case actionsDefinitions.DOCUMENT_LOADED:
            var documents = state.documents ? { ...state.documents } : {};
            documents[action.id] = action.document;
            return {
                headers: state.headers,
                documents: documents
            };

        case actionsDefinitions.DOCUMENT_ERROR:
            var documents = state.documents ? { ...state.documents } : {};
            documents[action.id] = action.error;
            return {
                headers: state.headers,
                documents: documents
            };

        default:
            return state;
    }
};