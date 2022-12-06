import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "@/App.vue";
import i18n from "@/i18n";
import router from "@/router";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const app = createApp(App);

app.use(i18n);
app.use(createPinia());
app.use(router);
app.component("FontAwesomeIcon", FontAwesomeIcon);

app.mount("#root");
