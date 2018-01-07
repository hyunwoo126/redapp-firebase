/**
 * Sends an email verification to the user.
 */
function sendEmailVerification() {
    // [START sendemailverification]
    firebase.auth().currentUser.sendEmailVerification().then(function() {
    // Email Verification sent!
    // [START_EXCLUDE]
    alert('Email Verification Sent!');
    // [END_EXCLUDE]
    });
    // [END sendemailverification]
}
function sendPasswordReset() {
    var email = firebase.auth().currentUser.email;
    // [START sendpasswordemail]
    firebase.auth().sendPasswordResetEmail(email).then(function() {
    // Password Reset Email Sent!
    // [START_EXCLUDE]
    alert('Password Reset Email Sent!');
    // [END_EXCLUDE]
    }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // [START_EXCLUDE]
    if (errorCode == 'auth/invalid-email') {
        alert(errorMessage);
    } else if (errorCode == 'auth/user-not-found') {
        alert(errorMessage);
    }
    console.log(error);
    // [END_EXCLUDE]
    });
    // [END sendpasswordemail];
}


//get data from firebase
function getData(isAdmin){
    if(typeof isAdmin != 'boolean'){ isAdmin = false; }
    console.log('getData');

    //add client data to vue
    function addClient(data, uid){
        var client = {
            email: data.email || '',
            apps: data.apps || [],
            uid: uid,
        }

        for(var i in client.apps){
            var stores = [];
            for(var store in client.apps[i].stores){
                var obj = client.apps[i].stores[store];
                obj.store = store;
                stores.push(obj);
            }
            client.apps[i].stores = stores;
            client.apps[i].i = i;
        }

        app.clients.push(client);
    }

    if(isAdmin){
        var docRef = db.collection("users").get().then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                var data = doc.data();
                addClient(data, doc.id);
            });
        }).catch(function(error) {
            alert('get data error.');
        });
    } else {
        var docRef = db.collection("users").doc(firebase.auth().currentUser.uid).get().then(function(doc){
            var data = doc.data();
            addClient(data, doc.id);
        }).catch(function(error) {
            alert('get data error.');
        });
    }
}



var db = null;
window.onload = function() {
    db = firebase.firestore();

    firebase.auth().onAuthStateChanged(function(user) {
        app.clearClients();
        if (user) {
            app.login.on = true;
            // User is signed in.
            var displayName = user.displayName;
            var email = user.email;
            var emailVerified = user.emailVerified;
            var photoURL = user.photoURL;
            var isAnonymous = user.isAnonymous;
            var uid = user.uid;
            var providerData = user.providerData;
            var docRef = db.collection("users").doc(uid).get().then(function(doc){
                if (doc.exists) {
                    var userDoc = doc.data();
                    getData(userDoc.admin);
                    app.login.isAdmin = userDoc.admin ? true : false;

                } else {
                    alert('User is not set up correctly. Please contact sky@redapp.co with your user information.');
                    firebase.auth().signOut();
                }
            }).catch(function(error) {
                console.log(error);
                alert('get userdata error');
                firebase.auth().signOut();
            });



        } else {
          // User is signed out.
          // ...
          app.login.on = false;
        }

        //document.getElementById('quickstart-sign-in').disabled = false;
    });


    //document.getElementById('quickstart-sign-in').addEventListener('click', toggleSignIn, false);
    //document.getElementById('quickstart-sign-up').addEventListener('click', handleSignUp, false);
    //document.getElementById('quickstart-verify-email').addEventListener('click', sendEmailVerification, false);
    //document.getElementById('quickstart-password-reset').addEventListener('click', sendPasswordReset, false);
   
    
};













Vue.component('new-store', {
    template: '\
    <div>\
    <select v-model="selection">\
        <option disabled value="">Please select store</option>\
        <option value="xiaomi" v-if="!hasStore(\'xiaomi\')">Xiaomi</option>\
        <option value="baidu" v-if="!hasStore(\'baidu\')">Baidu</option>\
        <option value="tencent" v-if="!hasStore(\'tencent\')">Tencent</option>\
        <option value="huawei" v-if="!hasStore(\'huawei\')">Huawei</option>\
        <option value="oppo" v-if="!hasStore(\'oppo\')">Oppo</option>\
        <option value="360" v-if="!hasStore(\'360\')">360</option>\
        <option value="alibaba" v-if="!hasStore(\'alibaba\')">Alibaba</option>\
        <option value="lenovo" v-if="!hasStore(\'lenovo\')">Lenovo</option>\
        <option value="meizu" v-if="!hasStore(\'meizu\')">Meizu</option>\
        <option value="anzhi" v-if="!hasStore(\'anzhi\')">Anzhi</option>\
    </select>\
    <button v-on:click="submit" :disabled="isDisabled" >Add New Store</button>\
    </div>\
    ',
    props:["app", "uid"],
    data: function(){
        return {
            isDisabled: false,
            selection: '',
        }
    },
    methods: {
        hasStore: function(store){
            for(var i in this.app.stores){
                if(this.app.stores[i].store == store){ return true; }
            }
            return false;
        },
        submit: function(){
            var that = this;
            this.isDisabled = true;
            if(this.selection.length){
                db.collection("users").doc(that.uid).get().then(function(doc){
                    if(doc.exists){
                        if(doc.data().apps){
                            var arr_apps = doc.data().apps;
                            var now = Date.now();
                            var newStore = {
                                completed: false,
                                created: now,
                                downloads: 0,
                                updated: now,
                            }
                            arr_apps[that.app.i].stores[that.selection] = newStore;

                            db.collection("users").doc(that.uid).update({
                                apps: arr_apps,
                            }).then(function(){
                                //update local
                                that.app.stores.push({
                                    store: that.selection,
                                    completed: false,
                                    created: now,
                                    downloads: 0,
                                    updated: now,
                                });
                                that.isDisabled = false;
                                that.selected = '';
                            });
                        }

                    }
                });                
            }
        }
    }
});

Vue.component('new-client', {
    template: '\
    <div>\
    <input type="text" placeholder="Email" v-model="email" :disabled="isDisabled"/>\
    <button v-on:click="submit" :disabled="isDisabled" >Add New Client</button>\
    </div>\
    ',
    data: function(){
        return {
            isDisabled: false,
            email: '',
            password: 'redapp123',
        }
    },
    methods: {
        submit: function(){
            var that = this;
            that.isDisabled = true;
            $.post(
                '/dashboard',
                //'http://localhost:5000/dashboard',
                //'https://redapp.co/dashboard',
            {
                email: that.email,
            }, function(data){
                if(data.error){
                    alert('there was error.');
                } else {
                    alert('user created. \n email: '+data.email+'\n password: '+data.password);
                }
                that.email = '';
                that.isDisabled = false;
                //wait for firebase to setup
                setTimeout(function(){
                    app.clearClients();
                    getData(true);
                }, 2000);
            }).fail(function(){
                alert('error');
                that.isDisabled = false;
            }); 
        }
    }
});



Vue.component('stores', {
    template: '\
        <tr class="li_stores">\
        <td class="capitalize">{{store.store}}</td>\
        <td v-if="isAdmin">\
        <select v-model="status" :disabled="isDisabled">\
            <option value="pending">Pending</option>\
            <option value="progress">In Progress</option>\
            <option value="online">Online</option>\
        </select>\
        </td>\
        <td v-else class="capitalize">{{status}}</td>\
        <td>{{updated}}</td>\
        <td>\
        <input v-if="isAdmin" type="text" v-model="link" :disabled="isDisabled"/>\
        <a v-else-if="store.link" v-bind:href="store.link" target="_blank">\
            on <span class="capitalize">{{store.store}}</span> Store\
        </a>\
        <span v-else>Not Available</span>\
        </td>\
        </tr>\
    ',
    props: ['store', 'app', 'uid'],
    data: function(){
        return {
            isDisabled: false,
            link: this.store.link,
            linkTimeout: null,
        }
    },
    watch: {
        link: function(val){
            clearTimeout(this.linkTimeout);
            var that = this;
            this.linkTimeout = setTimeout(function(){
                that.isDisabled = true;
                db.collection("users").doc(that.uid).get().then(function(doc){
                    if(doc.exists){
                        if(doc.data().apps){
                            var arr_apps = doc.data().apps;
                            var now = Date.now();
                            arr_apps[that.app.i].stores[that.store.store].updated = now;
                            arr_apps[that.app.i].stores[that.store.store].link = val;
                            db.collection("users").doc(that.uid).update({
                                apps: arr_apps,
                            }).then(function(){
                                console.log(val);
                                //update local
                                that.store.link = val;
                                that.isDisabled = false;
                            }).catch(function(){
                                alert('error');
                                that.isDisabled = false;
                            });
                        }
    
                    }
                });
            }, 1000);            
        }
    },
    computed: {
        isAdmin: function(){
            return app.login.isAdmin;
        },
        updated: function(){
            return moment(this.store.updated).format('lll');
        },
        status: {
            get: function () {
                return this.store.status || 'pending';
              },
              set: function (newStatus) {
                var that = this;
                this.isDisabled = true;
                db.collection("users").doc(that.uid).get().then(function(doc){
                    if(doc.exists){
                        if(doc.data().apps){
                            var arr_apps = doc.data().apps;
                            var now = Date.now();
                            arr_apps[that.app.i].stores[that.store.store].updated = now;
                            arr_apps[that.app.i].stores[that.store.store].status = newStatus;
                            db.collection("users").doc(that.uid).update({
                                apps: arr_apps,
                            }).then(function(){
                                //update local
                                that.store.status = newStatus;
                                that.isDisabled = false;
                            }).catch(function(){
                                alert('error');
                                that.isDisabled = false;
                            });
                        }

                    }
                });
              }
        },
    }
});

Vue.component('apps', {
    template: '\
        <li class="li_app base_boxshadow_1">\
            <h4>{{app.name}}</h4>\
            <table class="storeList">\
            <thead>\
            <td>Store</td>\
            <td>Status</td>\
            <td>Last Updated</td>\
            <td>Links</td>\
            </thead>\
            <tbody>\
            <tr is="stores" v-for="(store, key) in app.stores" v-bind:store="store" v-bind:app="app" v-bind:uid="uid"></tr>\
            </tbody>\
            </table>\
            <new-store v-bind:app="app" v-bind:uid="uid" v-if="isAdmin"></new-store>\
        </li>\
    ',
    props: ['app', 'uid'],
    computed: {
        isAdmin: function(){
            return app.login.isAdmin;
        },
    }
});


Vue.component('new-app', {
    template: '\
    <li class="li_app base_boxshadow_1">\
    <div v-if="isAdmin">\
        <input type="text" placeholder="App Name" v-model="appName" :disabled="isDisabled"/>\
        <button v-on:click="submit" :disabled="isDisabled" >Add New app</button>\
    </div>\
    <a v-else href="/appsubmit">Submit a New App</a>\
    </li>\
    ',
    props: ["email", "apps", "uid"],
    data: function(){
        return {
            isDisabled: false,
            appName: '',
        }
    },
    computed: {
        isAdmin: function(){
            return app.login.isAdmin;
        },
    },
    methods: {
        submit: function(){
            var that = this;
            if(that.appName.length){
                that.isDisabled = true;
                db.collection("users").doc(that.uid).get().then(function(doc){
                    if(doc.exists){
                        var arr_apps = [];
                        var i_next = 0;
                        if(doc.data().apps){
                            arr_apps = doc.data().apps;
                            i_next = arr_apps.length;
                        }

                        arr_apps.push({
                            completed: false,
                            name: that.appName,
                            stores: {},
                        });

                        db.collection("users").doc(that.uid).set({
                            apps: arr_apps,
                        }, {merge: true}).then(function(){
                            //update local
                            that.apps.push({
                                i: i_next,
                                name: that.appName,
                                completed: false,
                                stores: [],
                            });
                            that.appName = '';
                            that.isDisabled = false;
                        }).catch(function(error){
                            console.error(error);
                            that.isDisabled = false;
                        });
                    } else {
                        console.log('user doc doesnt exist');
                    }
                }).catch(function(error){
                    console.error(error);
                    that.isDisabled = false;
                });

                
            }

        }
    }
});

Vue.component('clients', {
    template: '\
        <li>\
            <div v-if="isAdmin">client: {{ client.email }}</div>\
            <ul>\
                <new-app\
                    v-bind:email="client.email"\
                    v-bind:apps="client.apps"\
                    v-bind:uid="client.uid"\
                ></new-app>\
                <li is="apps" v-for="app in client.apps" v-bind:app="app" v-bind:uid="client.uid"></li>\
            </ul>\
        </li>\
    ',
    props: ['client'],
    computed: {
        isAdmin: function(){
            return app.login.isAdmin;
        },
    },
});



var app = new Vue({
    el: '#app',
    data: {
        login: {
            on: false,
            email: '',
            password: '',
            isAdmin: false,
        },
        newClient: {
            email: '',
            appName: '',
        },
        clients: [],
    },
    computed: {
        currentUser: function(){
            if(this.login.on){
                return firebase.auth().currentUser || {};
            }
            else { return {}; }
        }
    },
    methods: {
        clearClients: function(){
            while(this.clients.length){
                this.clients.pop();
            }
        },
        signOut: function(e){
            if(firebase.auth().currentUser){
                firebase.auth().signOut();
                this.login.on = false;
            }
        },
        signIn: function(e){
            var email = this.login.email;
            var password = this.login.password;
            if (email.length < 4) {
                alert('Please enter an email address.');
                return;
            }
            if (password.length < 4) {
                alert('Please enter a password.');
                return;
            }
            // Sign in with email and pass.
            // [START authwithemail]
            firebase.auth().signInWithEmailAndPassword(email, password).then(function(){
                app.login.on = true;
                app.login.email = '';
                app.login.password = '';
            }).catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // [START_EXCLUDE]
                if (errorCode === 'auth/wrong-password') {
                alert('Wrong password.');
                } else {
                alert(errorMessage);
                }
                console.log(error);
                // [END_EXCLUDE]
            });
        },
        signUp: function(){
            var email = this.login.email;
            var password = this.login.password;
            if (email.length < 4) {
                alert('Please enter an email address.');
                return;
            }
            if (password.length < 4) {
                alert('Please enter a password.');
                return;
            }
            // Sign in with email and pass.
            // [START createwithemail]
            firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // [START_EXCLUDE]
                if (errorCode == 'auth/weak-password') {
                    alert('The password is too weak.');
                } else {
                    alert(errorMessage);
                }
                console.log(error);
                // [END_EXCLUDE]
            });
            // [END createwithemail]
        },
    },
});



