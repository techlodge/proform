import { defineComponent } from "vue";

export default defineComponent({
  setup(_, { slots }) {
    return () => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(24, 1fr)",
          width: "100%",
        }}
      >
        {slots.default?.()}
      </div>
    );
  },
});
