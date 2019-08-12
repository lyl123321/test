## Vue 生命周期详解
### Vue 生命周期流程
最开始，用户使用 new Vue() 创建根 Vue 实例，或者实例化子组件（**我们将这两种实例都称为`vm`**）：
```
function Vue(options) {
  ...
  this._init(options)
}
```
`vm`实例化时会调用原型方法`this._init`方法进行初始化：
```
Vue.prototype._init = function(options) {
  vm.$options = mergeOptions(  // 合并options
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
  )
  ...
  initLifecycle(vm) // 开始一系列的初始化
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate')
  initInjections(vm)
  initState(vm)
  initProvide(vm)
  callHook(vm, 'created')
  ...
  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}
```
#### beforeCreate
首先，将用户提供的`options`对象，父组件定义在子组件上的`event`、`props`(子组件实例化时)，`vm`原型方法，和`Vue`构造函数内置的选项合并成一个新的`options`对象，赋值给`vm.$options`。
接下来，执行 3 个初始化方法：
1. initLifecycle(vm): 主要作用是确认组件的父子关系和初始化某些实例属性。找到父组件实例赋值给`vm.$parent`，将自己`push`给父组件的`$children`；
2. initEvents(vm): 主要作用是将父组件使用`v-on`或`@`注册的自定义事件添加到子组件的私有属性`vm._events`中；
3. initRender(vm): 主要作用是初始化用来将`render`函数转为`vnode`的两个方法`vm._c` 和`vm.$createElement`。用户自定义的`render`函数的参数`h`就是`vm.$createElement`方法，它可以返回`vnode`。
等以上操作全部完成，就会执行`beforeCreate`钩子函数，此时在函数中可以通过`this`访问到`vm.$parent`和`vm.$createElement`等有限的属性和方法。
#### created
接下来会继续执行 3 个初始化方法：
1. initInjections(vm): 初始化`inject`，使得`vm`可以访问到对应的依赖；
2. initState(vm): 初始化会被使用到的状态，状态包括`props`，`methods`，`data`，`computed`，`watch`五个选项。调用相应的`init`方法，使用`vm.$options`中提供的选项对这些状态进行初始化，其中`initData`
方法会调用`observe(data, true)`，实现对`data`中属性的监听，实际上是使用`Object.defineProperty`方法定义属性的`getter`和`setter`方法；
3. initProvide(vm)：初始化`provide`，使得`vm`可以为子组件提供依赖。
这 3 个初始化方法先初始化`inject`，然后初始化`props/data`状态，最后初始化`provide`，这样做的目的是可以在`props/data`中使用`inject`内所注入的内容。
等以上操作全部完成，就会执行`created`钩子函数，此时在函数中可以通过`this`访问到`vm`中的`props`，`methods`，`data`，`computed`，`watch`和`inject`等大部分属性和方法。
#### beforeMount
如果用户在创建根 Vue 实例时提供了`el`选项，那么在实例化时会直接调用`vm.$mount`方法开始挂载：
```
if (vm.$options.el) {
  vm.$mount(vm.$options.el)
}
```
如果未提供`el`选项，则需要用户自己调用`vm.$mount`方法开始挂载。`vm.$mount`方法：
```
运行时版本：
Vue.prototype.$mount = function(el) { // 最初的定义
  return mountComponent(this, query(el));
}
完整版：
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function(el) {  // 拓展编译后的
	var options = this.$options;
  if(!options.render) {
    if(options.template) {
      ...							//一些判断
    } else if (el) {	//传入的 el 选项不为空
      options.template = getOuterHTML(el);
    }
		
		if (options.template) {
				options.render = compileToFunctions(template, ...).render	//将 template 编译成 render 函数
		}
  }
  ...
  return mount.call(this, query(el))
}
```
在`vm.$mount`方法中，如果用户未提供`render`函数，就会将`template`或者`el.outerHTML`编译成`render`函数。
然后会执行`mountComponent`函数：
```
export function mountComponent(vm, el) {
  vm.$el = el
  ...
  callHook(vm, 'beforeMount')
  ...
  const updateComponent = function () {
    vm._update(vm._render())	// 调用 render 函数生成 vnode，并挂载到 HTML中
  }
  ...
	if (vm.$vnode == null) {
	  vm._isMounted = true;
	  callHook(vm, 'mounted');
	}
}
```
如果用户提供了`el`选项，则会获取用于挂载的真实节点，将此节点赋值给`vm.$el`属性。
等以上操作全部完成，就会执行`beforeMount`钩子函数，如果用户提供了`el`选项，此时在函数中可以通过`this`访问到`vm.$el`属性，此时它的值为`el`提供的真实节点。
#### mounted
在`mountComponent`方法中，会执行`vm._render()`方法获取`vnode`：
```
Vue.prototype._render = function() {
  const vm = this
  const { render } = vm.$options

  const vnode = render.call(vm, vm.$createElement)
  
  return vnode
}
```
在`vm._render`方法中会调用`vm.$options`中的`render`函数，传入实参`vm.$createElement`(对应声明`render`函数时的形参`h`)，得到返回结果`vnode`，`vnode`是一
个树形结构的`JavaScript`对象。接下来需要将这棵虚拟`DOM`树转化为真实的`DOM`树：
```
const updateComponent = function () {
  vm._update(vm._render())
}
```
不管是挂载时的首次渲染，还是在数据改变后的更新页面，都会调用`updateComponent`方法，而`vm._update`方法会将`vm._render`方法
返回的虚拟节点`vnode`转化为真实的`Dom`节点：
```
Vue.prototype._update = function(vnode) {
  ...
  if (!prevVnode) {
    // 首次渲染
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
  } else {
    // 更新
    vm.$el = vm.__patch__(prevVnode, vnode);
  }
  ...
}
```
`vm.__patch__`方法传入的参数`vm.$el`是之前在`mountComponent`方法中挂载的真实`Dom`元素，Vue 调用`vm.__patch__`生成真实`Dom`：
```
Vue.prototype.__patch__ = createPatchFunction({ nodeOps, modules }) 
```
`nodeOps`是一些操作原生`Dom`的方法的集合，`modules`是`class/attrs/style`等属性创建、更新、销毁时相应钩子方法的集合，
而`createPatchFunction`函数返回了一个函数：
```
export function createPatchFunction(backend) {
  ...
  const { modules, nodeOps } = backend
  
  return function (oldVnode, vnode) {  // 接收新旧 vnode
    ...
    
    const isRealElement = isDef(oldVnode.nodeType) // 是否是真实 Dom
    if(isRealElement) {  // 首次渲染传入的 vm.$el 是真实 Dom
      oldVnode = emptyNodeAt(oldVnode)  // 将 vm.$el 转为 VNode 格式
    }
    ...
  }
}
```
调用`emptyNodeAt`函数将传入的`vm.$el`转为`VNode`格式，`VNode`是`Vue`定义的虚拟节点类，`vnode`是它的实例对象：
```
function emptyNodeAt(elm) {
  return new VNode(
    nodeOps.tagName(elm).toLowerCase(), // 对应tag属性
    {},  // 对应data
    [],   // 对应children
    undefined,  //对应text
    elm  // 真实dom赋值给了elm属性
  )
}
包装后的：
{
  tag: 'div',
  elm: '<div id="app"></div>' // 真实dom
}
```
然后继续创建真实`Dom`：
```
export function createPatchFunction(backend) { 
  ...
  
  return function (oldVnode, vnode) {  // 接收新旧vnode
  
    const insertedVnodeQueue = []
    ...
    const oldElm = oldVnode.elm  //包装后的真实 Dom <div id='app'></div>
    const parentElm = nodeOps.parentNode(oldElm)  // 首次父节点为<body></body>
  	
    createElm(  // 创建真实 Dom
      vnode, // 传入的 vnode
      insertedVnodeQueue,  // 空数组
      parentElm,  // <body></body>
      nodeOps.nextSibling(oldElm)  // 下一个节点
    )
    
    return vnode.elm // 返回真实 Dom 覆盖 vm.$el
  }
}
```
`createElm`方法开始生成真实的`Dom`，即`vnode.elm`，挂载到`HTML`中，并返回真实`Dom`覆盖`vm.$el`。
等以上操作全部完成，就会执行`mounted`钩子函数，此时在函数中可以通过`this`访问到`vm.$el`属性，此时它为虚拟`vnode`转化而来的真实`Dom`。
参考链接：[彻底搞懂虚拟Dom到真实Dom的生成过程](https://juejin.im/post/5d42e5036fb9a06b0d7c66b0)
#### beforeUpdate
每个组件实例都对应一个`watcher`实例，它是在`mountComponent`方法中，在调用`mounted`钩子之前实例化的：
```
export function mountComponent(vm, el) {
  ...
  callHook(vm, 'beforeMount')
  ...
	const updateComponent = function () {
	  vm._update(vm._render(), hydrating);
	};
  new Watcher(vm, updateComponent, noop, {	//在 Watcher 构造函数中绑定 updateComponent 后会立即调用，开始更新组件
    before: function before () {
     if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate');
      }
    }
  }, true /* isRenderWatcher */);
  ...
	callHook(vm, 'mounted');
}
```
如果是`RenderWatcher`，`vm._watcher`会用它赋值：
```
var Watcher = function Watcher (vm, expOrFn, cb, options, isRenderWatcher) {
  this.vm = vm;					//关联组件
  if (isRenderWatcher) {
    vm._watcher = this;
  }
  vm._watchers.push(this);
	...
	this.before = options.before;
	...
	if (typeof expOrFn === 'function') {
	  this.getter = expOrFn;		//即 vm._watcher.getter = updateComponent
	}
}
```
`watcher`会在组件渲染的过程中把`接触`过的数据属性记录为依赖。之后当依赖的值发生改变，触发依赖的`setter`方法时，会通知`watcher`，从而使它关联的组件(`vm`)重新渲染。
一旦侦听到数据变化，`Vue`将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更。如果同一个`watcher`被多次触发，只会被推入到队列中一次。
等当前事件循环结束，下一次事件循环开始，`Vue`会刷新队列并执行已去重的工作。`Vue`会尝试使用`Promise.then`、`MutationObserver`和`setImmediate`发布的微任务来执行异步队列中的`task`。
```
function flushSchedulerQueue () {
	...
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    if (watcher.before) {
      watcher.before();		//执行 beforeUpdate 钩子函数
    }
		watcher.run();	//
		...
	}
	...
	// call component updated and activated hooks
	callActivatedHooks(activatedChildren.slice());	//执行 activated 钩子函数
	callUpdatedHooks(queue.slice());		//执行 updated 钩子函数
}
```
在执行`watcher.run`方法之前，会执行`watcher.before`方法，从而执行`beforeUpdate`钩子函数。
#### updated
在执行`watcher.run`方法时，会调用`watcher.getter`方法，而其中某个`watcher`(`vm._watcher`)的`getter`就是`updateComponent`方法：
```
Watcher.prototype.run = function run () {
    if (this.active) {
      var value = this.get();				//调用 watcher.get 方法
			...
		}
		...
}

Watcher.prototype.get = function get () {
    ...
    try {
      value = this.getter.call(vm, vm);	//调用 watcher.getter 方法
    }
		...
}
```
调用`updateComponent`方法
```
updateComponent = function () {
  vm._update(vm._render(), hydrating);
};
```
`vm._render`方法会重新执行`render`函数生成`vnode`，然后`vm._update`方法会将`vnode`转化为真实`Dom`，挂载到`HTML`中，并覆盖`vm.$el`。
```
function callUpdatedHooks (queue) {
  var i = queue.length;
  while (i--) {
    var watcher = queue[i];
    var vm = watcher.vm;
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated');	//执行 updated 钩子函数
    }
  }
}
```
等以上操作全部完成，就会执行`updated`钩子函数，此时在函数中通过`this.$el`访问到`vm.$el`属性的值为更新后的真实`Dom`。
#### beforeDestroy
#### destroyed

#### activated
如果我们研究的实例`vm`是一个组件实例，而且它被`<keep-alive>`包裹，那么它将额外具有两个钩子函数`activated`和`deactivated`。
假如`vm`是`根 Vue 实例`的一个子组件，在`根 Vue 实例`挂载时，会在它的`patch`方法中生成真实`Dom`，遇到子节点会调用`createChildren`
方法先生成子节点的真实`Dom`，再将子`Dom`元素插入根`Dom`元素中。如果子节点为组件，会先调用`createComponent`初始化子组件，
然后子组件调用`$mount`开始挂载，生成子组件`vnode`，再转化子组件`vnode`为真实`Dom`，如果还存在孙子组件，则递归初始化组件...
在根 Vue 实例的`patch`方法中的`insertedVnodeQueue`存储了这些被插入的子、孙子组件的`vnode`：
```
function patch() {
	...
	invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);	//调用 insert 钩子
	return vnode.elm	//真实 Dom 元素
}

root.$el = vm.__patch__(...)	//`patch`方法返回真实 Dom 元素给根 Vue 实例的 $el，之后会调用根 Vue 实例的 mounted 钩子
```
`vm.$vnode`也在`insertedVnodeQueue`中，在`invokeInsertHook`函数中，会调用这些`vnode`的`insert`钩子:
```
function invokeInsertHook(vnode, queue, initial) {
	// delay insert hooks for component root nodes, invoke them after the
	// element is really inserted
	if (isTrue(initial) && isDef(vnode.parent)) {	
		vnode.parent.data.pendingInsert = queue;
	} else {
		//只有根 Vue 实例的 initial 为 false，所以会延迟到根 Vue 实例 patch 方法的末尾调用这些 insert 钩子
		for (var i = 0; i < queue.length; ++i) {
			queue[i].data.hook.insert(queue[i]);
		}
	}
}
```
`vm.$vnode.data.hook.insert`方法：
```
insert: function insert(vnode) {	//传入 vm.$vnode
	var context = vnode.context;	//父组件实例
	var componentInstance = vnode.componentInstance;	//vnode 对应的组件实例 vm
	if (!componentInstance._isMounted) {
		componentInstance._isMounted = true;
		callHook(componentInstance, 'mounted');	//调用 vm 的 mounted 钩子函数（所以子组件的 mounted 钩子先于父组件被调用）
	}
	if (vnode.data.keepAlive) {		//true
		if (context._isMounted) {
			// 在父组件更新时
			queueActivatedComponent(componentInstance);
		} else {
			// 在父组件挂载时
			activateChildComponent(componentInstance, true /* direct */ );
		}
	}
}
```
`activateChildComponent`函数会调用`vm`及其子组件的`activated`钩子函数：
```
function activateChildComponent(vm, direct) {
	...
	if (vm._inactive || vm._inactive === null) {
		vm._inactive = false;
		for (var i = 0; i < vm.$children.length; i++) {
			activateChildComponent(vm.$children[i]);	//递归调用子组件的 activated 钩子
		}
		callHook(vm, 'activated');		//调用 vm 的 activated 钩子
	}
}
```
在组件实例`vm`首次挂载，调用`mounted`钩子函数后，马上会调用`activated`钩子函数。
之后组件实例`vm`的`activated`钩子函数会在组件被激活时被调用。
### Vue 生命周期流程图