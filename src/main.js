import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
	el: '#app',
  render: h => h(App),
  beforeCreate() {
    console.log('Root 实例调用了beforeCreate')
    console.log(this.$el)
  },
  created() {
    console.log('Root 实例调用了created')
    console.log(this.$el)
  },
  beforeMount() {
    console.log('Root 实例调用了beforeMount')
    console.log(this.$el)
  },
  mounted() {
    console.log('Root 实例调用了mounted')
    console.log(this.$el)
  },
  beforeUpdate() {
    console.log('Root 实例调用了beforeUpdate')
    console.log(this.$el)
  },
  updated() {
    console.log('Root 实例调用了updated')
    console.log(this.$el)
  },
  beforeDestory() {
    console.log('Root 实例调用了beforeDestory')
    console.log(this.$el)
  },
  destoryed() {
    console.log('Root 实例调用了destoryed')
    console.log(this.$el)
  }
});
