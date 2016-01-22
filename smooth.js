import React, {Component} from 'react-native';

class PropMeta {
  constructor(params) {
    Object.assign(this, params);
  }
  getFromProps(props) {
    return props[this.propName];
  }
  propsIntegrator(value) {
    const propName = this.propName;
    return function integrateIntoProps(props) {
      props[propName] = value;
    }; 
  }
  propsIntegration(value) {
    return {
      [this.propName]: this.propsIntegrator(value)
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
  createSmoothComponent: function(ComponentToSmooth, metasOfPropsToSmooth, duration = 300) {
    return class extends Component {
      constructor() {
        super(...arguments);
        this.state = {};
        this.timeoutsForTweens = {};
        this.targets = {};
      }
      render() {
        const props = {...this.props};
        for (let i in this.state) {
          this.state[i](props);
        }
        return (
          <ComponentToSmooth {...props} />
        );
      }
      componentWillReceiveProps(nextProps) {
        if (super.componentWillReceiveProps) {
          super.componentWillReceiveProps(...arguments);
        }
        const start = new Date;
        metasOfPropsToSmooth.forEach(meta => {
          const propName = meta.propName;
          const target = meta.default(meta.getFromProps(nextProps));
          const origin = meta.default(meta.getFromProps(this.props));
          if (this.timeoutsForTweens[propName]) {
            cancelAnimationFrame(this.timeoutsForTweens[propName]);
            this.timeoutsForTweens[propName] = null;
            this.setState(meta.propsIntegration(this.targets[propName]));
          }
          this.targets[propName] = target;
          if (meta.differ(target, origin)) {
            const diff = meta.substract(target, origin);
            const unit = meta.divide(diff, duration);
            let tween = () => {
              this.timeoutsForTweens[propName] = requestAnimationFrame(() => {
                const timePassed = new Date - start;
                if (timePassed > duration) {
                  this.timeoutsForTweens[propName] = null;
                  this.setState(meta.propsIntegration(target));
                  tween = null;
                  return;
                }
                const value = meta.add(origin, meta.multiply(unit, timePassed));
                const wrap = meta.propsIntegration(value);
                this.setState(wrap, tween);
              });
            };
            tween();
            return;
          }
          this.setState(meta.propsIntegration(target));
        });
      }
    }
  } 
}