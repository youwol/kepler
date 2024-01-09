## Crease angle

See also [here](https://codepen.io/Ni55aN/pen/zROmoe?editors=1010), and [here](https://gist.github.com/Ni55aN/90c017fafbefd3e31ef8d98ab6566cfa)

```js
const calcNormal = (normals, normal, angle) => {
    let allowed = normals.filter(
        (n) => n.angleTo(normal) < (angle * Math.PI) / 180,
    )
    return allowed.reduce((a, b) => a.clone().add(b)).normalize()
}
```

## Edition
