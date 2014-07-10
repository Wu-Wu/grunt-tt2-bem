<form class="no-csrf b-text b-text_size_14" method="get" action="/domain/new/rereg_details">
    <input type="hidden" name="dname" value="[% dname %]" />
    <p class="b-text_margin-bottom_25">
        Срок регистрации доменного имени истекает...<br />
        <br />
        <span class="i-bold free-date-wrap">Домен освобождается: <span class="free-date">[% free_date %]</span></span>
    </p>

    [%-
        INCLUDE 'b-button.inc'
            attr => {
                type => 'submit'
            },
            text => ru ? 'Подать заявку' : 'Apply';
    -%]
</form>
