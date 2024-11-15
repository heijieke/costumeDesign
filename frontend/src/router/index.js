import { createWebHistory, createRouter } from "vue-router";
import Diy from "@/views/Diy.vue";
import sucaiRender from "@/views/sucaiRender.vue";
import texture from '@/views/texture.vue';
import Surface from '@/views/Surface.vue';

const routes = [
  {
    path: "/diy",
    name: "Diy",
    component: Diy,
  },
  {
    path: "/sucaiRender",
    name: "sucaiRender",
    component: sucaiRender,
  },
  {
    path: "/texture",
    name: "texture",
    component: texture,
  },
  {
    path: "/surface",
    name: "surface",
    component: Surface,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;