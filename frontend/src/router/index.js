import { createWebHistory, createRouter } from "vue-router";
import Diy from "@/views/Diy.vue";
import SVGRender from "@/views/SVGRender.vue";
import texture from '@/views/texture.vue';
import Surface from '@/views/Surface.vue';

const routes = [
  {
    path: "/diy",
    name: "Diy",
    component: Diy,
  },
  {
    path: "/svgrender",
    name: "SVGRender",
    component: SVGRender,
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