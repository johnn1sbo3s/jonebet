export function modelNameToNaturalName(modelName) {
    return modelName.
        replace(/_/g, " ").
        replace(/\b\w/g, (c) => c.
        toUpperCase())
}

export function modelNameToIdName(modelName) {
    return modelName.
        replace(/\s+/g, "_").
        toLowerCase()
}