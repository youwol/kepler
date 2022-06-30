// import { stringify } from 'querystring'
import {
	// Float32BufferAttribute, 
	// BufferGeometry, 
	// Group, 
	// Mesh, 
	// Color, 
	// MeshBasicMaterial, 
	// Vector3, 
	CanvasTexture, 
	// LinearFilter, 
	SpriteMaterial, 
	Sprite, 
	// Texture, 
	// PlaneBufferGeometry, 
	// DoubleSide, 
	// LineBasicMaterial, 
	// Line,
	// BufferAttribute,
	OrthographicCamera,
	Scene,
	// PlaneGeometry,
	WebGLRenderer,
	Camera
} from 'Three'
import { ColorMap } from './colorMap'

/*
SEE https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_colors_lookuptable.html
See https://github.com/makc/three.js.fork/blob/master/examples/js/math/Lut.js
*/

export class ScaleBar {

	camera: Camera = undefined
	scene: Scene = undefined
	sprite: Sprite = undefined

	constructor(lut: ColorMap | string) {
		this.scene = new Scene()

		this.camera = new OrthographicCamera( - 1, 1, 1, - 1, 1, 2 )
		this.camera.position.set( 0.8, 0, 1 )

		if (typeof lut === 'string') {
			lut = new ColorMap(lut, 32)
		}

		this.sprite = new Sprite( new SpriteMaterial( {
			map: new CanvasTexture( lut.createCanvas() )
		} ) );
		this.sprite.scale.x = 0.05
		this.scene.add( this.sprite )
	}

	render = (renderer: WebGLRenderer) => {
		renderer.render(this.scene, this.camera)
	}

	setColorMap(lut: ColorMap) {
		// lut.setColorMap( params.colorMap )
		// lut.setMax( 2000 )
		// lut.setMin( 0 )

		const map = this.sprite.material.map
		lut.updateCanvas( map.image )
		map.needsUpdate = true
	}
}



/*
export class ScaleBar {

    legend = {
        layout: '',
        position: {'x': 0, 'y': 0, 'z': 0},
        dimensions: { 'width': 20, 'height': 3 },
        canvas: undefined,  // <------------
		ctx: undefined,     // <------------ 2d context of the canvas 
        texture: undefined, 
        legendGeometry: undefined,
        legendMaterial: undefined,
        mesh: undefined,
        labels: {
            fontsize: undefined,
		    fontface: undefined,
		    title: undefined,
		    um: undefined,
		    ticks: undefined,
		    decimal: undefined,
		    notation: undefined
        }
    }
    map: ColorMap = undefined
    mapname: string = 'Insar'
    n: number = 10
    layout = undefined
	minV: number = 0
    maxV: number = 1

    constructor( colormap: ColorMap | string, parameters ) {
		if ( parameters === undefined ) {
			parameters = {}
		}

		this.legend.layout = parameters.hasOwnProperty( 'layout' ) ? parameters[ 'layout' ] : 'vertical';
		this.legend.position = parameters.hasOwnProperty( 'position' ) ? parameters[ 'position' ] : { 'x': 21.5, 'y': 8, 'z': 5 };
		this.legend.dimensions = parameters.hasOwnProperty( 'dimensions' ) ? parameters[ 'dimensions' ] : { 'width': 0.5, 'height': 3 };
		this.legend.canvas = document.createElement( 'canvas' );
		this.legend.canvas.setAttribute( 'id', 'legend' );
		this.legend.canvas.setAttribute( 'hidden', true );
		document.body.appendChild( this.legend.canvas );
		this.legend.ctx = this.legend.canvas.getContext( '2d' );
		this.legend.canvas.setAttribute( 'width',  1 );
		this.legend.canvas.setAttribute( 'height', this.n );
		this.legend.texture = new Texture( this.legend.canvas );
		const imageData = this.legend.ctx.getImageData( 0, 0, 1, this.n );
		const data = imageData.data;
		const len = data.length;


        // ColorMapKeywords is defined in Lut (see Kepler)
		if (typeof colormap === 'string') {
			this.map = new ColorMap(colormap, 32)
		} else {
			this.map = colormap
		}

		var k = 0;
		var step = 1.0 / this.n;
		const map = this.map.mapColors
		for ( var i = 1; i >= 0; i -= step ) {
			for ( var j = map.length - 1; j >= 0; j -- ) {
				if ( i < map[ j ][ 0 ] && i >= map[ j - 1 ][ 0 ]  ) {
					var min = map[ j - 1 ][ 0 ];
					var max = map[ j ][ 0 ];
					var color = new Color( 0xffffff );
					var minColor = new Color( 0xffffff ).setHex( map[ j - 1 ][ 1 ] );
					var maxColor = new Color( 0xffffff ).setHex( map[ j ][ 1 ] );
					color = minColor.lerp( maxColor, ( i - min ) / ( max - min ) );

					data[ k * 4 ] = Math.round( color.r * 255 );
					data[ k * 4 + 1 ] = Math.round( color.g * 255 );
					data[ k * 4 + 2 ] = Math.round( color.b * 255 );
					data[ k * 4 + 3 ] = 255;

					k += 1;
				}
			}
		}

		this.legend.ctx.putImageData( imageData, 0, 0 )
		this.legend.texture.needsUpdate = true

		this.legend.legendGeometry = new PlaneBufferGeometry( this.legend.dimensions.width, this.legend.dimensions.height )
		this.legend.legendMaterial = new MeshBasicMaterial( { map : this.legend.texture, side : DoubleSide } )

		this.legend.mesh = new Mesh( this.legend.legendGeometry, this.legend.legendMaterial )

		if ( this.legend.layout == 'horizontal' ) {
			this.legend.mesh.rotation.z = - 90 * ( Math.PI / 180 )
		}

		this.legend.mesh.position.copy( this.legend.position )
		//return this.legend.mesh;
	}

	get mesh() {
		return this.legend.mesh
	}

	setLegendOff() {
		this.legend = null;
		return this.legend;
	}

	setLegendLayout( layout ) {
		if ( ! this.legend ) {
			return false;
		}

		if ( this.legend.layout == layout ) {
			return false;
		}

		if ( layout != 'horizontal' && layout != 'vertical' ) {
			return false;
		}

		this.layout = layout;

		if ( layout == 'horizontal' ) {
			this.legend.mesh.rotation.z = 90 * ( Math.PI / 180 );
		}

		if ( layout == 'vertical' ) {
			this.legend.mesh.rotation.z = - 90 * ( Math.PI / 180 );
		}

		return this.legend.mesh;
	}

	setLegendPosition( position: Vector3 ) {
		this.legend.position = new Vector3( position.x, position.y, position.z );
		return this.legend
	}

	setLegendLabels( parameters, callback ) {
		if ( ! this.legend ) {
			return false;
		}

		if ( typeof parameters === 'function' ) {
			callback = parameters;
		}

		if ( parameters === undefined ) {
			parameters = {};
		}

		this.legend.labels.fontsize = parameters.hasOwnProperty( 'fontsize' ) ? parameters[ 'fontsize' ] : 24;
		this.legend.labels.fontface = parameters.hasOwnProperty( 'fontface' ) ? parameters[ 'fontface' ] : 'Arial';
		this.legend.labels.title = parameters.hasOwnProperty( 'title' ) ? parameters[ 'title' ] : '';
		this.legend.labels.um = parameters.hasOwnProperty( 'um' ) ? ' [ ' + parameters[ 'um' ] + ' ]' : '';
		this.legend.labels.ticks = parameters.hasOwnProperty( 'ticks' ) ? parameters[ 'ticks' ] : 0;
		this.legend.labels.decimal = parameters.hasOwnProperty( 'decimal' ) ? parameters[ 'decimal' ] : 2;
		this.legend.labels.notation = parameters.hasOwnProperty( 'notation' ) ? parameters[ 'notation' ] : 'standard';
		const backgroundColor = { r: 255, g: 100, b: 100, a: 0.8 };
		const borderColor =  { r: 255, g: 0, b: 0, a: 1.0 };
		const borderThickness = 4;
		const canvasTitle = document.createElement( 'canvas' );
		const contextTitle = canvasTitle.getContext( '2d' );
		contextTitle.font = 'Normal ' + this.legend.labels.fontsize * 1.2 + 'px ' + this.legend.labels.fontface;
		//var metrics = contextTitle.measureText( this.legend.labels.title.toString() + this.legend.labels.um.toString() );
		//var textWidth = metrics.width;
		contextTitle.fillStyle   = 'rgba(' + backgroundColor.r + ',' + backgroundColor.g + ',' + backgroundColor.b + ',' + backgroundColor.a + ')';
		contextTitle.strokeStyle = 'rgba(' + borderColor.r + ',' + borderColor.g + ',' + borderColor.b + ',' + borderColor.a + ')';
		contextTitle.lineWidth = borderThickness;
		contextTitle.fillStyle = 'rgba( 0, 0, 0, 1.0 )';
		contextTitle.fillText( this.legend.labels.title.toString() + this.legend.labels.um.toString(), borderThickness, this.legend.labels.fontsize + borderThickness );

		const txtTitle = new CanvasTexture( canvasTitle );
		txtTitle.minFilter = LinearFilter;

		const spriteMaterialTitle = new SpriteMaterial( { map: txtTitle } );
		const spriteTitle = new Sprite( spriteMaterialTitle );
		spriteTitle.scale.set( 2, 1, 1.0 );

		if ( this.legend.layout == 'vertical' ) {
			spriteTitle.position.set( this.legend.position.x + this.legend.dimensions.width, this.legend.position.y + ( this.legend.dimensions.height * 0.45 ), this.legend.position.z );
		}

		if ( this.legend.layout == 'horizontal' ) {
			spriteTitle.position.set( this.legend.position.x * 1.015, this.legend.position.y + ( this.legend.dimensions.height * 0.03 ), this.legend.position.z );
		}

		if ( this.legend.labels.ticks > 0 ) {
			var ticks = {};
			var lines = {};

			if ( this.legend.layout == 'vertical' ) {
				var topPositionY = this.legend.position.y + ( this.legend.dimensions.height * 0.36 );
				var bottomPositionY = this.legend.position.y - ( this.legend.dimensions.height * 0.61 );
			}

			if ( this.legend.layout == 'horizontal' ) {
				var topPositionX = this.legend.position.x + ( this.legend.dimensions.height * 0.75 );
				var bottomPositionX = this.legend.position.x - ( this.legend.dimensions.width * 1.2  ) ;
			}

			for ( var i = 0; i < this.legend.labels.ticks; i ++ ) {
				let value = ( this.maxV - this.minV ) / ( this.legend.labels.ticks - 1  ) * i + this.minV
				let svalue = ''

				if ( callback ) {
					value = callback ( value )
					svalue = value.toString()
				} else {
					if ( this.legend.labels.notation == 'scientific' ) {
						svalue = value.toExponential( this.legend.labels.decimal );
						value = parseFloat(svalue)
					} else {
						svalue = value.toFixed( this.legend.labels.decimal );
						value = parseFloat(svalue)
					}
				}

				const canvasTick = document.createElement( 'canvas' );
				const contextTick = canvasTick.getContext( '2d' );
				contextTick.font = 'Normal ' + this.legend.labels.fontsize + 'px ' + this.legend.labels.fontface;

				//var metrics = contextTick.measureText( svalue.toString() );
				//var textWidth = metrics.width;

				contextTick.fillStyle   = 'rgba(' + backgroundColor.r + ',' + backgroundColor.g + ',' + backgroundColor.b + ',' + backgroundColor.a + ')';
				contextTick.strokeStyle = 'rgba(' + borderColor.r + ',' + borderColor.g + ',' + borderColor.b + ',' + borderColor.a + ')';
				contextTick.lineWidth = borderThickness;
				contextTick.fillStyle = 'rgba( 0, 0, 0, 1.0 )';
				contextTick.fillText( value.toString(), borderThickness, this.legend.labels.fontsize + borderThickness );
				const txtTick = new CanvasTexture( canvasTick );
				txtTick.minFilter = LinearFilter;
				const spriteMaterialTick = new SpriteMaterial( { map: txtTick } );
				const spriteTick = new Sprite( spriteMaterialTick );
				spriteTick.scale.set( 2, 1, 1.0 );

				if ( this.legend.layout == 'vertical' ) {
					const position = bottomPositionY + ( topPositionY - bottomPositionY ) * ( ( value - this.minV ) / ( this.maxV - this.minV ) );
					spriteTick.position.set( this.legend.position.x + ( this.legend.dimensions.width * 2.7 ), position, this.legend.position.z );
				}

				if ( this.legend.layout == 'horizontal' ) {

					const position = bottomPositionX + ( topPositionX - bottomPositionX ) * ( ( value - this.minV ) / ( this.maxV - this.minV ) );
					let offset = undefined
					if ( this.legend.labels.ticks > 5 ) {
						if ( i % 2 === 0 ) {
							offset = 1.7;
						} else {
							offset = 2.1;
						}
					} else {
						offset = 1.7;
					}
					spriteTick.position.set( position, this.legend.position.y - this.legend.dimensions.width * offset, this.legend.position.z );
				}

				const material = new LineBasicMaterial( { color: 0x000000, linewidth: 2 } );

				const vertices = []

				if ( this.legend.layout == 'vertical' ) {
					const linePosition = ( this.legend.position.y - ( this.legend.dimensions.height * 0.5 ) + 0.01 ) + ( this.legend.dimensions.height ) * ( ( value - this.minV ) / ( this.maxV - this.minV ) * 0.99 );
					vertices.push( this.legend.position.x + this.legend.dimensions.width * 0.55, linePosition, this.legend.position.z  )
					vertices.push( this.legend.position.x + this.legend.dimensions.width * 0.7, linePosition, this.legend.position.z  )
				}

				if ( this.legend.layout == 'horizontal' ) {
					const linePosition = ( this.legend.position.x - ( this.legend.dimensions.height * 0.5 ) + 0.01 ) + ( this.legend.dimensions.height ) * ( ( value - this.minV ) / ( this.maxV - this.minV ) * 0.99 );
					vertices.push( linePosition, this.legend.position.y - this.legend.dimensions.width * 0.55, this.legend.position.z  )
					vertices.push( linePosition, this.legend.position.y - this.legend.dimensions.width * 0.7, this.legend.position.z  )
				}

				const geometry = new BufferGeometry()
				geometry.setAttribute('position', new BufferAttribute(vertices, 3) )
				const line = new Line( geometry, material )

				lines[ i ] = line;
				ticks[ i ] = spriteTick;

			}

		}

		return { 'title': spriteTitle,  'ticks': ticks, 'lines': lines };
	}
}
*/