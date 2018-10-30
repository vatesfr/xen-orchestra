const apply = (value, fn) => fn(value)
export default fns => fns.reduceRight(apply)
