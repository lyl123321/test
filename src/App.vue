<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
		<p>{{message}}</p>
		<keep-alive>
			<HelloWorld :msg="message" v-if="show"/>
		</keep-alive>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'app',
	props: ['prop'],
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
		debugger;
  },
  created() {
    console.log('App 组件实例调用了created')
		//debugger;
  },
  beforeMount() {
    console.log('App 组件实例调用了beforeMount')
		//debugger;
  },
  mounted() {
    console.log('App 组件实例调用了mounted')
		//debugger;
		this.$children[0].message = 'HelloWorld.message';
		this.message = 'App.message';
		//this.show = false;
  },
  activated() {
    console.log('App 组件实例调用了activated')
		//debugger;
  },
  deactivated() {
    console.log('App 组件实例调用了deactivated')
		//debugger;
  },
  beforeUpdate() {
    console.log('App 组件实例调用了beforeUpdate')
		//debugger;
  },
  updated() {
    console.log('App 组件实例调用了updated')
		//debugger;
  },
  beforeDestory() {
    console.log('App 组件实例调用了beforeDestory')
		//debugger;
  },
  destoryed() {
    console.log('App 组件实例调用了destoryed')
		//debugger;
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
