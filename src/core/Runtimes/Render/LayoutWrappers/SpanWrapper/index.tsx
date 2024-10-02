import { defineComponent } from "vue";

export default defineComponent({
  props: {
    columns: {
      type: Number,
      default: 24,
    },
  },
  setup(props, { slots }) {
    return () => (
      <div
        style={{
          gridColumn: `span ${props.columns}`,
        }}
      >
        {slots.default?.()}
      </div>
    );
  },
});
