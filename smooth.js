import React, {Component, InteractionManager} from 'react-native';

class PropMeta {
  constructor(params) {
    Object.assign(this, params);
  }
  getFromProps(props) {
    return props[this.propName];
  }
  propsIntegrator(value) {
    const propName = this.propName;
    return function integrateIntoProps(previousState, currentProps) {
      previousState[propName] = value;
    }; 
  }
}

class NumbericPropMeta extends PropMeta {
  constructor() {
    super(...arguments);
  }
  default(v = 0) {
    return v;
  }
  add(a, b) {
    return a + b;
  }
  substract(a, b) {
    return a - b;
  }
  multiply(a, b) {
    return a * b;
  }
  divide(a, b) {
    return a / b;
  }
  differ(a, b) {
    return Math.abs(a - b) > 1;
  }
}

class CoordinatePropMeta extends PropMeta {
  constructor() {
    super(...arguments);
  }
  default(v = {}) {
    const {x = 0, y = 0} = v;
    return {x, y};
  }
  add(a, b) {
    return {
      x: a.x + b.x,
      y: a.y + b.y
    };
  }
  substract(a, b) {
    return {
      x: a.x - b.x,
      y: a.y - b.y
    };
  }
  multiply(a, b) {
    return {
      x: a.x * b,
      y: a.y * b
    };
  }
  divide(a, b) {
    return {
      x: a.x / b,
      y: a.y / b
    };
  }
  differ(a, b) {
    return (
      Math.abs(a.x - b.x) > 1 ||
      Math.abs(a.y - b.y) > 1
    );
  }
}

class ColorPropMeta extends PropMeta {
  constructor() {
    super(...arguments);
  }
  default(v = []) {
    const [r = 0, g = 0, b = 0, a = 0] = v;
    return [r, g, b, a];
  }
  add(a, b) {
    return [
      a[0] + b[0], a[1] + b[1],
      a[2] + b[2], a[3] + b[3]
    ];
  }
  substract(a, b) {
    return [
      a[0] - b[0], a[1] - b[1],
      a[2] - b[2], a[3] - b[3]
    ];
  }
  multiply(a, b) {
    return [
      a[0] * b, a[1] * b,
      a[2] * b, a[3] * b
    ];
  }
  divide(a, b) {
    return [
      a[0] / b, a[1] / b,
      a[2] / b, a[3] / b
    ];
  }
  differ(a, b) {
    return (
      Math.abs(a[0] - b[0]) > 1 ||
      Math.abs(a[1] - b[1]) > 1 ||
      Math.abs(a[2] - b[2]) > 1 ||
      Math.abs(a[3] - b[3]) > 1
    );
  }
}

export default {
  PropMeta,
  NumbericPropMeta,
  CoordinatePropMeta,
  ColorPropMeta,
  createSmoothComponent: function(ComponentToSmooth, metasOfPropsToSmooth, duration = 200) {
    return class extends Component {
      constructor() {
        super(...arguments);
        this.state = {};
        this.animationFrames = {};
        this.targets = {};
      }
      render() {
        const {smoothEnabled = true, ...passProps} = this.props;
        if (smoothEnabled) {
          Object.assign(passProps, this.state);
        }
        return (
          <ComponentToSmooth {...passProps} />
        );
      }
      componentWillReceiveProps(nextProps) {
        if (super.componentWillReceiveProps) {
          super.componentWillReceiveProps(...arguments);
        }
        const start = new Date;
        const props = {...this.props, ...this.state};
        metasOfPropsToSmooth.forEach(meta => {
          const target = meta.default(meta.getFromProps(nextProps));
          if (nextProps.smoothEnabled === false) {
            this.setState(meta.propsIntegrator(target));
            return;
          }
          const origin = meta.default(meta.getFromProps(props));
          const propName = meta.propName;
          if (meta.differ(target, origin)) {
            if (this.animationFrames[propName]) {
              cancelAnimationFrame(this.animationFrames[propName]);
              this.animationFrames[propName] = null;
              this.setState(meta.propsIntegrator(this.targets[propName]));
            }
            this.targets[propName] = target;
            const diff = meta.substract(target, origin);
            const unit = meta.divide(diff, duration);
            let tween = () => {
              this.animationFrames[propName] = requestAnimationFrame(() => {
                const timePassed = new Date - start;
                if (timePassed >= duration) {
                  this.animationFrames[propName] = null;
                  this.setState(meta.propsIntegrator(target));
                  return;
                }
                const value = meta.add(origin, meta.multiply(unit, timePassed));
                this.setState(meta.propsIntegrator(value), tween);
              });
            };
            tween();
            return;
          }
        });
      }
    }
  }
}