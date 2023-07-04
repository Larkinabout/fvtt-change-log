export const MODULE = {
    ID: 'change-log',
    NAME: 'Change Log'
}

const TEMPLATE_DIR = `modules/${MODULE.ID}/templates`

export const TEMPLATE = {
    CHAT_CARD: `${TEMPLATE_DIR}/chat-card.hbs`,
    TAG_FORM: `${TEMPLATE_DIR}/tag-form.hbs`
}

export const BOOLEAN_ICON = {
    false: '<i class="fa fa-xmark"></i>',
    true: '<i class="fa fa-check"></i>'
}

export const DELIMITER = ';'
