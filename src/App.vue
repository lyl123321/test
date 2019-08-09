<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
		<p>{{message}}</p>
		<keep-alive>
			<HelloWorld msg="2" v-if="show"/>
		</keep-alive>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'app',
  data(){
		return {
			message: 1,
			show: true
		}
  },
	computed: {
		comp() {
			return this.message + 1
		}
	},
  beforeCreate() {
    console.log('App 组件实例调用了beforeCreate')
    console.log('data: ' + this.message)
		console.log('computed: ' + this.comp)
    console.log(this.$el)
  },
  created() {
    console.log('App 组件实例调用了created')
    console.log(this.message)
		console.log('computed: ' + this.comp)
    console.log(this.$el)
  },
  beforeMount() {
    console.log('App 组件实例调用了beforeMount')
    console.log(this.message)
		console.log('computed: ' + this.comp)
    console.log(this.$el)
  },
  mounted() {
    console.log('App 组件实例调用了mounted')
    console.log(this.message)
		console.log('computed: ' + this.comp)
    console.log(this.$el)
		//this.$children[0].message = 'HelloWorld.message';
		//this.message = 'App.message';
		this.show = false;
  },
  activated() {
    console.log('App 组件实例调用了activated')
    console.log(this.message)
		console.log('computed: ' + this.comp)
    console.log(this.$el)
  },
  deactivated() {
    console.log('App 组件实例调用了deactivated')
    console.log(this.message)
		console.log('computed: ' + this.comp)
    console.log(this.$el)
  },
  beforeUpdate() {
    console.log('App 组件实例调用了beforeUpdate')
    console.log(this.message)
		console.log('computed: ' + this.comp)
    console.log(this.$el)
  },
  updated() {
    console.log('App 组件实例调用了updated')
    console.log(this.message)
		console.log('computed: ' + this.comp)
    console.log(this.$el)
  },
  beforeDestory() {
    console.log('App 组件实例调用了beforeDestory')
    console.log(this.message)
		console.log('computed: ' + this.comp)
    console.log(this.$el)
  },
  destoryed() {
    console.log('App 组件实例调用了destoryed')
    console.log(this.message)
		console.log('computed: ' + this.comp)
    console.log(this.$el)
  },
  components: {
    HelloWorld
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
