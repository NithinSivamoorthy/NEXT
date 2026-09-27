/** Local display identity only. No password, credential or authentication state. */
export function validUsername(value:string){return /^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,23}$/u.test(value.trim());}
